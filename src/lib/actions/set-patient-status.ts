"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth/authorize";
import { writeAuditLog } from "@/lib/auth/audit-log";
import type { PatientStatus } from "@/generated/prisma/client";

export interface SetPatientStatusResult {
  ok: boolean;
  error?: string;
}

const ALLOWED: readonly PatientStatus[] = ["ACTIVE", "COMPLETED", "INACTIVE"];

/**
 * Moves a patient between Active, Completed and Archived from the patients
 * list.
 *
 * Archiving is as far as "remove" goes, deliberately. `Patient` is the parent
 * of appointments, invoices, invoice line items, documents, prescriptions,
 * consent forms, perio charts, the treatment plan and the message thread, and
 * every one of those relations is `onDelete: Cascade` — so a hard delete
 * behind a row menu would silently erase a patient's entire clinical and
 * billing history, and take the practice's historical revenue figures with
 * it. Nothing here deletes; the record drops out of the default view and can
 * be brought back from the same menu.
 */
export async function setPatientStatus(params: {
  patientId: string;
  status: PatientStatus;
}): Promise<SetPatientStatusResult> {
  try {
    const session = await requireRole(["DENTIST", "HYGIENIST", "RECEPTIONIST", "ADMIN"]);
    const organizationId = session.user.organizationId;

    if (!ALLOWED.includes(params.status)) {
      return { ok: false, error: "That isn't a valid status." };
    }

    // Org-scoped: `requireRole` proves the role, not that this patient belongs
    // to the caller's practice.
    const patient = await prisma.patient.findFirst({
      where: { id: params.patientId, organizationId },
      select: { id: true, status: true },
    });
    if (!patient) return { ok: false, error: "That patient is no longer in this practice." };
    if (patient.status === params.status) return { ok: true };

    await prisma.patient.update({
      where: { id: patient.id },
      data: { status: params.status },
    });

    await writeAuditLog({
      organizationId,
      actorUserId: session.user.id,
      action: "patient.status_changed",
      resourceType: "Patient",
      resourceId: patient.id,
      metadata: { from: patient.status, to: params.status },
    });

    for (const path of [
      "/patients",
      "/hygienist/patients",
      "/receptionist/patients",
      "/dashboard",
      "/hygienist/dashboard",
      "/receptionist/dashboard",
    ]) {
      revalidatePath(path);
    }

    return { ok: true };
  } catch {
    return { ok: false, error: "Couldn't update this patient. Please try again." };
  }
}
