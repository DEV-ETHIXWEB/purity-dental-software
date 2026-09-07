"use client";

import { useState } from "react";
import { Loader2, ShieldAlert } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { CreditCardIcon } from "@/components/ui/icons/purity-icons";
import { CheckmarkIcon, InfoIcon } from "@/components/ui/icons/purity-raster-icons";
import type { InvoiceWithDetails } from "@/lib/data/billing";
import { formatCentsAsCurrency, invoiceNumber } from "@/lib/billing-format";
import { markInvoicePaid } from "@/lib/actions/mark-invoice-paid";

interface PayBalanceModalProps {
  invoice: InvoiceWithDetails | null;
  onClose: () => void;
  onConfirmed: (invoiceId: string) => void;
}

/**
 * "Pay balance" flow. This deliberately collects NO real payment details (no
 * card number/CVV/expiry fields) — there is no payment processor integrated
 * yet, so confirming marks the invoice PAID via the real `markInvoicePaid`
 * Server Action rather than actually charging anything.
 */
export function PayBalanceModal({ invoice, onClose, onConfirmed }: PayBalanceModalProps) {
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleClose() {
    onClose();
    window.setTimeout(() => {
      setDone(false);
      setError(null);
    }, 200);
  }

  async function handleConfirm() {
    if (!invoice) return;
    setSubmitting(true);
    setError(null);
    const result = await markInvoicePaid(invoice.id);
    setSubmitting(false);
    if (result.ok) {
      setDone(true);
      onConfirmed(invoice.id);
    } else {
      setError(result.error ?? "Something went wrong.");
    }
  }

  return (
    <Modal
      open={invoice !== null}
      onClose={handleClose}
      title={done ? "Payment recorded" : "Pay balance"}
      description={
        invoice && !done
          ? `Invoice ${invoiceNumber(invoice)} — ${formatCentsAsCurrency(invoice.totalCents)} due`
          : undefined
      }
    >
      {done ? (
        <div className="flex flex-col items-center gap-3 py-4 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-success-bg text-success">
            <CheckmarkIcon className="h-6 w-6" aria-hidden="true" />
          </div>
          <p className="flex items-start gap-1.5 text-left text-sm text-text-secondary">
            <InfoIcon className="h-4 w-4 shrink-0 translate-y-0.5" aria-hidden="true" />
            This invoice is now marked paid. No real payment processor is connected yet — this
            records the payment status only.
          </p>
          <Button variant="outline" size="sm" onClick={handleClose} className="mt-1 min-h-11">
            Done
          </Button>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          <div className="flex items-start gap-2 rounded-[var(--radius-lg)] bg-warning-bg px-4 py-3 text-sm text-warning-text">
            <ShieldAlert className="h-4 w-4 shrink-0 translate-y-0.5" aria-hidden="true" />
            <p>
              <strong className="font-semibold">No payment processor connected yet.</strong> No card
              details are collected here. Confirming marks this invoice as paid.
            </p>
          </div>
          {error && (
            <p role="alert" className="text-sm text-error">
              {error}
            </p>
          )}
          <div className="flex flex-wrap items-center gap-3">
            <Button variant="ghost" onClick={handleClose} className="min-h-11">
              Cancel
            </Button>
            <Button onClick={handleConfirm} disabled={submitting} className="min-h-11">
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin motion-reduce:animate-none" aria-hidden="true" />
                  Processing…
                </>
              ) : (
                <>
                  <CreditCardIcon className="h-4 w-4" aria-hidden="true" />
                  Confirm
                </>
              )}
            </Button>
          </div>
        </div>
      )}
    </Modal>
  );
}
