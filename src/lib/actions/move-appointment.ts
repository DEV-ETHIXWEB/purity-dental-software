"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth/authorize";
import { getProviderById } from "@/lib/data/providers";
import { writeAuditLog } from "@/lib/auth/audit-log";

export interface MoveAppointmentResult {
  ok: boolean;
  error?: string;
}

/**
 * Drops an existing appointment into a different slot on the schedule board.
 *
 * The staff counterpart to `reschedulePatientAppointment`, and deliberately
 * not a reuse of it: that one is gated to the PATIENT role and re-resolves
 * the booking through the caller's own patient record, which is exactly the
 * scoping a receptionist moving someone else's visit must not have. This one
 * is org-scoped instead.
 *
 * Two behavioural differences from the patient flow, both because the
 * practice is the one making the change:
 *
 *  - status is preserved. A patient moving a visit resets it to SCHEDULED so
 *    the practice re-confirms; the practice moving it *is* the confirmation.
 *  - a time in the past is allowed. Staff correct yesterday's board, and
 *    anything left open there surfaces in the "Needs attention" queue anyway.
 *
 * Duration comes from the existing row rather than the caller, so dragging a
 * 90-minute crown into a new hour keeps it 90 minutes.
 *
 * `providerId` is optional and only the front desk sends it: the receptionist
 * board covers the whole practice, so moving a visit there can also mean
 * handing it to a different clinician. Omitted, the appointment keeps the
 * provider it had.
 */
export async function moveAppointment(params: {
  appointmentId: string;
  /** ISO instant for the new start. The board builds it from the slot's practice-local hour. */
  startTime: string;
  /** Reassign to this clinician. Omit to keep the current one. */
  providerId?: string;
}): Promise<MoveAppointmentResult> {
  try {
    const session = await requireRole(["DENTIST", "HYGIENIST", "RECEPTIONIST", "ADMIN"]);
    const organizationId = session.user.organizationId;

    const appointment = await prisma.appointment.findFirst({
      where: { id: params.appointmentId, organizationId },
      select: { id: true, providerId: true, status: true, startTime: true, endTime: true },
    });
    if (!appointment) return { ok: false, error: "That appointment no longer exists." };
    if (appointment.status === "CANCELLED") {
      return { ok: false, error: "A cancelled visit can't be moved." };
    }

    const startTime = new Date(params.startTime);
    if (Number.isNaN(startTime.getTime())) {
      return { ok: false, error: "That isn't a valid time." };
    }

    // Re-read against this organisation rather than trusting the id off the
    // wire — same reasoning as `bookAppointment`.
    let providerId = appointment.providerId;
    if (params.providerId && params.providerId !== appointment.providerId) {
      const provider = await getProviderById(organizationId, params.providerId);
      if (!provider) return { ok: false, error: "That provider is not available." };
      providerId = provider.id;
    }

    const durationMs = appointment.endTime.getTime() - appointment.startTime.getTime();
    const endTime = new Date(startTime.getTime() + durationMs);

    if (
      startTime.getTime() === appointment.startTime.getTime() &&
      providerId === appointment.providerId
    ) {
      return { ok: true }; // Dropped back where it started.
    }

    // Excludes itself, or the appointment always clashes with its own row.
    const clash = await prisma.appointment.findFirst({
      where: {
        organizationId,
        providerId,
        id: { not: appointment.id },
        status: { not: "CANCELLED" },
        startTime: { lt: endTime },
        endTime: { gt: startTime },
      },
      select: { id: true },
    });
    if (clash) return { ok: false, error: "That slot overlaps another appointment." };

    await prisma.appointment.update({
      where: { id: appointment.id },
      data: { startTime, endTime, providerId },
    });

    await writeAuditLog({
      organizationId,
      actorUserId: session.user.id,
      action: "appointment.moved",
      resourceType: "Appointment",
      resourceId: appointment.id,
      metadata: {
        from: appointment.startTime.toISOString(),
        to: startTime.toISOString(),
        ...(providerId !== appointment.providerId
          ? { fromProviderId: appointment.providerId, toProviderId: providerId }
          : {}),
      },
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
    return { ok: false, error: "Couldn't move that appointment. Please try again." };
  }
}
