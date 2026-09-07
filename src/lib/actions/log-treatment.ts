"use server";

import { requireRole } from "@/lib/auth/authorize";
import { getPatientById } from "@/lib/data/patients";
import { createInvoiceFromTreatment, type TreatmentLineItemInput } from "@/lib/data/billing";
import { writeAuditLog } from "@/lib/auth/audit-log";

export interface LogTreatmentResult {
  ok: boolean;
  error?: string;
}

/**
 * Server Action backing `LogTreatmentModal`'s "Send to Billing" button — the
 * Figma flow's "+Select Treatment Plan → +Services Send to billing" step.
 * Only Dentist/Hygienist/Admin log treatment (Receptionist doesn't perform
 * clinical procedures); the created Invoice is scoped to the signed-in
 * user's own organization regardless of what the client claims.
 */
export async function logTreatmentAndSendToBilling(
  patientId: string,
  lineItems: TreatmentLineItemInput[],
  notes: string,
): Promise<LogTreatmentResult> {
  try {
    const session = await requireRole(["DENTIST", "HYGIENIST", "ADMIN"]);

    if (lineItems.length === 0) {
      return { ok: false, error: "Select at least one procedure." };
    }

    const patient = await getPatientById(session.user.organizationId, patientId);
    if (!patient) {
      return { ok: false, error: "Patient not found." };
    }

    const invoice = await createInvoiceFromTreatment({
      organizationId: session.user.organizationId,
      patientId: patient.id,
      providerId: session.user.id,
      lineItems,
      notes,
    });

    await writeAuditLog({
      organizationId: session.user.organizationId,
      actorUserId: session.user.id,
      action: "invoice.created_from_treatment",
      resourceType: "Invoice",
      resourceId: invoice.id,
    });

    return { ok: true };
  } catch {
    return { ok: false, error: "Something went wrong sending this to billing. Please try again." };
  }
}
