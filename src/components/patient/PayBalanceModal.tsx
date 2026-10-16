"use client";

import Link from "next/link";
import { Phone, ShieldAlert } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { ChatIconFilled } from "@/components/ui/icons/purity-icons";
import type { InvoiceWithDetails } from "@/lib/data/billing";
import { formatCentsAsCurrency, invoiceNumber } from "@/lib/billing-format";

interface PayBalanceModalProps {
  invoice: InvoiceWithDetails | null;
  /** The practice's number from Admin > Practice, when it has been set. */
  phone?: string | null;
  onClose: () => void;
}

/**
 * "Pay balance" — how to settle an invoice, not a way to clear it.
 *
 * This used to call `markInvoicePaid`, which meant a patient could set their
 * own invoice to PAID from the portal while no money changed hands: there is
 * no payment processor, so the button only moved the status. Recording a
 * payment is the practice's job now (gated on `billing.recordPayment`), and
 * this tells the patient how to actually pay instead of pretending they
 * just did.
 *
 * When a processor is wired up, this is the component that gains the real
 * payment step — the action it used to call is staff-only and should stay
 * that way.
 */
export function PayBalanceModal({ invoice, phone, onClose }: PayBalanceModalProps) {
  return (
    <Modal
      open={invoice !== null}
      onClose={onClose}
      title="Pay this invoice"
      description={
        invoice
          ? `Invoice ${invoiceNumber(invoice)} — ${formatCentsAsCurrency(invoice.totalCents)} due`
          : undefined
      }
    >
      <div className="flex flex-col gap-4">
        <div className="flex items-start gap-2 rounded-[var(--radius-lg)] bg-warning-bg px-4 py-3 text-sm text-warning-text">
          <ShieldAlert className="h-4 w-4 shrink-0 translate-y-0.5" aria-hidden="true" />
          <p>
            <strong className="font-semibold">Online payment isn&apos;t available yet.</strong> You
            can pay at the practice or over the phone, and the front desk will mark this invoice as
            paid once it&apos;s settled.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {phone && (
            <a
              href={`tel:${phone}`}
              className="cta-gradient-slide inline-flex min-h-11 items-center gap-2 rounded-[var(--radius-lg)] px-4 text-sm font-medium text-white shadow-card focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-brand-blue)]"
            >
              <Phone className="h-4 w-4" aria-hidden="true" />
              Call the practice
            </a>
          )}
          <Link
            href="/patient/messages"
            onClick={onClose}
            className="inline-flex min-h-11 items-center gap-2 rounded-[var(--radius-lg)] border border-border bg-transparent px-4 text-sm font-medium text-text-primary transition-colors hover:bg-surface-muted focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-brand-blue)]"
          >
            <ChatIconFilled className="h-4 w-4" aria-hidden="true" />
            Message the practice
          </Link>
          <Button variant="ghost" onClick={onClose} className="min-h-11">
            Close
          </Button>
        </div>
      </div>
    </Modal>
  );
}
