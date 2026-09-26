"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/auth/authorize";
import { writeAuditLog } from "@/lib/auth/audit-log";

export interface SetMessagingAccessResult {
  ok: boolean;
  error?: string;
}

/**
 * Grants or revokes a patient's access to their care-team message thread —
 * the front desk deciding who gets a direct line to the hygienist.
 *
 * Gated on the `messaging.grant` permission rather than a role list, so an
 * admin can hand this to a specific clinician (or take it off a particular
 * receptionist) without promoting or demoting anyone. Receptionists hold it
 * by default; dentists and hygienists don't.
 *
 * Revoking is not destructive: the thread and its history stay, staff keep
 * full access to both, and the patient keeps seeing what was already said.
 * All it removes is the patient's ability to send anything further — so
 * turning it back on resumes the same conversation rather than starting a
 * new one.
 */
export async function setMessagingAccess(params: {
  patientId: string;
  allowed: boolean;
}): Promise<SetMessagingAccessResult> {
  try {
    const session = await requirePermission("messaging.grant");
    const organizationId = session.user.organizationId;

    // Org-scoped: `requireRole` proves the role, not that this patient
    // belongs to the caller's practice.
    const patient = await prisma.patient.findFirst({
      where: { id: params.patientId, organizationId },
      select: { id: true, canMessageCareTeam: true },
    });
    if (!patient) return { ok: false, error: "That patient is no longer in this practice." };
    if (patient.canMessageCareTeam === params.allowed) return { ok: true };

    await prisma.patient.update({
      where: { id: patient.id },
      data: { canMessageCareTeam: params.allowed },
    });

    await writeAuditLog({
      organizationId,
      actorUserId: session.user.id,
      action: params.allowed ? "patient.messaging_granted" : "patient.messaging_revoked",
      resourceType: "Patient",
      resourceId: patient.id,
      metadata: { from: patient.canMessageCareTeam, to: params.allowed },
    });

    for (const path of [
      "/receptionist/patients",
      "/patient/messages",
      "/patient/dashboard",
      "/hygienist/messages",
    ]) {
      revalidatePath(path);
    }

    return { ok: true };
  } catch {
    return { ok: false, error: "Couldn't update messaging access. Please try again." };
  }
}
