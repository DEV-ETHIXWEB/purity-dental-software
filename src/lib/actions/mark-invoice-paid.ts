"use server";

import { requireRole } from "@/lib/auth/authorize";
import { prisma } from "@/lib/prisma";
import { writeAuditLog } from "@/lib/auth/audit-log";

export interface MarkInvoicePaidResult {
  ok: boolean;
  error?: string;
}

/**
 * Marks an invoice PAID, scoped to the signed-in user's own organization.
 * Two different callers use this: staff (Dentist/Hygienist/Receptionist/
 * Admin) marking any invoice in their org paid from the billing tables, and
 * a PATIENT paying their own balance via the self-service "Pay balance"
 * flow (`PayBalanceModal`) — a PATIENT may only ever mark *their own*
 * invoice paid, so that case gets an extra ownership check the staff case
 * doesn't need (staff are already scoped to "any invoice in their org").
 *
 * Also decrements the patient's denormalized `balanceCents` by the invoice
 * total, in the same transaction — mirroring `createInvoiceFromTreatment`'s
 * increment, so "what this patient owes" never drifts from their actual
 * invoice history. Guarded to a no-op if the invoice is already PAID so a
 * duplicate click/replay can't decrement the balance twice.
 */
export async function markInvoicePaid(invoiceId: string): Promise<MarkInvoicePaidResult> {
  try {
    const session = await requireRole(["DENTIST", "HYGIENIST", "RECEPTIONIST", "ADMIN", "PATIENT"]);

    const found = await prisma.$transaction(async (tx) => {
      const invoice = await tx.invoice.findFirst({
        where: { id: invoiceId, organizationId: session.user.organizationId },
        include: { patient: true },
      });
      if (!invoice) return false;
      if (session.user.role === "PATIENT" && invoice.patient.userId !== session.user.id) {
        return false;
      }
      if (invoice.status === "PAID") return true;

      // No payment-method capture UI exists yet (that would be a separate
      // patient-portal feature) — default to CASH so `paymentMethod` is
      // never left null on a paid invoice, matching what Recent
      // Transactions/invoice detail display for every other paid invoice.
      await tx.invoice.update({
        where: { id: invoice.id },
        data: { status: "PAID", paymentMethod: invoice.paymentMethod ?? "CASH" },
      });
      await tx.patient.update({
        where: { id: invoice.patientId },
        data: { balanceCents: { decrement: invoice.totalCents } },
      });
      return true;
    });

    if (!found) {
      return { ok: false, error: "Invoice not found." };
    }

    await writeAuditLog({
      organizationId: session.user.organizationId,
      actorUserId: session.user.id,
      action: "invoice.marked_paid",
      resourceType: "Invoice",
      resourceId: invoiceId,
    });

    return { ok: true };
  } catch {
    return { ok: false, error: "Couldn't mark this invoice as paid. Please try again." };
  }
}
