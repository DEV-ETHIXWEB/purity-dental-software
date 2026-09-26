"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth/authorize";
import { writeAuditLog } from "@/lib/auth/audit-log";
import { isUnresolvedPastVisit, type AppointmentOutcome } from "@/lib/appointment-status";

export interface ResolveAppointmentResult {
  ok: boolean;
  error?: string;
}

/**
 * Closes out a past visit that was never marked up — the human half of the
 * "Needs attention" queue described in `lib/appointment-status.ts`.
 *
 * Only appointments whose time has actually passed can be resolved, and only
 * from an open status. That keeps this from being a general-purpose status
 * setter: it can't retroactively un-cancel a visit, and it can't mark a
 * booking completed before it has happened.
 */
export async function resolveAppointment(params: {
  appointmentId: string;
  outcome: AppointmentOutcome;
}): Promise<ResolveAppointmentResult> {
  try {
    const session = await requireRole(["DENTIST", "HYGIENIST", "RECEPTIONIST", "ADMIN"]);
    const organizationId = session.user.organizationId;

    if (params.outcome !== "COMPLETED" && params.outcome !== "NO_SHOW") {
      return { ok: false, error: "That isn't a valid outcome." };
    }

    // Scoped to the caller's own organization — `requireRole` proves the role,
    // not that this appointment belongs to their practice.
    const appointment = await prisma.appointment.findFirst({
      where: { id: params.appointmentId, organizationId },
      select: { id: true, status: true, endTime: true },
    });
    if (!appointment) return { ok: false, error: "That appointment no longer exists." };

    if (!isUnresolvedPastVisit(appointment)) {
      return { ok: false, error: "This visit has already been closed out." };
    }

    await prisma.appointment.update({
      where: { id: appointment.id },
      data: {
        status: params.outcome,
        // Recorded late, so punctuality is unknown rather than assumed good.
        completedOnTime: params.outcome === "COMPLETED" ? null : undefined,
      },
    });

    await writeAuditLog({
      organizationId,
      actorUserId: session.user.id,
      action: params.outcome === "COMPLETED" ? "appointment.marked_completed" : "appointment.marked_no_show",
      resourceType: "Appointment",
      resourceId: appointment.id,
      metadata: { previousStatus: appointment.status },
    });

    for (const path of [
      "/schedule",
      "/dashboard",
      "/hygienist/schedule",
      "/hygienist/dashboard",
      "/receptionist/schedule",
      "/receptionist/dashboard",
    ]) {
      revalidatePath(path);
    }

    return { ok: true };
  } catch {
    return { ok: false, error: "Couldn't update this visit. Please try again." };
  }
}
