"use server";

import { requireRole } from "@/lib/auth/authorize";
import { createManualInvoice, type TreatmentLineItemInput } from "@/lib/data/billing";
import { writeAuditLog } from "@/lib/auth/audit-log";

export interface CreateManualInvoiceResult {
  ok: boolean;
  error?: string;
  invoiceId?: string;
}

/**
 * Server Action backing the Invoices page's "+ New Invoice" button — a
 * freeform invoice (patient + line items picked directly, not derived from
 * a logged treatment). Same underlying write as `logTreatmentAndSendToBilling`
 * (both call `createInvoiceFromTreatment`/`createManualInvoice`, which are
 * the same function), kept as a separate action only so the audit log
 * records which flow actually created the invoice.
 */
export async function createManualInvoiceAction(
  patientId: string,
  lineItems: TreatmentLineItemInput[],
  notes: string,
): Promise<CreateManualInvoiceResult> {
  try {
    const session = await requireRole(["DENTIST", "HYGIENIST", "ADMIN"]);

    if (!patientId) {
      return { ok: false, error: "Select a patient." };
    }
    if (lineItems.length === 0) {
      return { ok: false, error: "Add at least one line item." };
    }

    const invoice = await createManualInvoice({
      organizationId: session.user.organizationId,
      patientId,
      providerId: session.user.id,
      lineItems,
      notes,
    });

    await writeAuditLog({
      organizationId: session.user.organizationId,
      actorUserId: session.user.id,
      action: "invoice.created_manual",
      resourceType: "Invoice",
      resourceId: invoice.id,
    });

    return { ok: true, invoiceId: invoice.id };
  } catch {
    return { ok: false, error: "Something went wrong creating this invoice. Please try again." };
  }
}
