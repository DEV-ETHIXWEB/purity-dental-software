"use client";

import { useState } from "react";
import { CheckCircle2, Loader2, ShieldAlert } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { formatCentsAsCurrency, type SampleInvoice } from "@/lib/sample-data";

interface PayBalanceModalProps {
  invoice: SampleInvoice | null;
  totalCents: number;
  onClose: () => void;
  onConfirmed: (invoiceId: string) => void;
}

/**
 * UI-only "pay balance" demo. This deliberately collects NO payment details
 * (no card number/CVV/expiry fields) — it exists purely to demonstrate the
 * flow shape. Confirming just marks the invoice paid in local component
 * state; nothing is charged or persisted anywhere.
 */
export function PayBalanceModal({ invoice, totalCents, onClose, onConfirmed }: PayBalanceModalProps) {
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  function handleClose() {
    onClose();
    window.setTimeout(() => setDone(false), 200);
  }

  function handleConfirm() {
    if (!invoice) return;
    setSubmitting(true);
    window.setTimeout(() => {
      setSubmitting(false);
      setDone(true);
      onConfirmed(invoice.id);
    }, 700);
  }

  return (
    <Modal
      open={invoice !== null}
      onClose={handleClose}
      title={done ? "Payment recorded (demo)" : "Pay balance"}
      description={
        invoice && !done
          ? `Invoice ${invoice.invoiceNumber} — ${formatCentsAsCurrency(totalCents)} due`
          : undefined
      }
    >
      {done ? (
        <div className="flex flex-col items-center gap-3 py-4 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-success-bg text-success">
            <CheckCircle2 className="h-6 w-6" aria-hidden="true" />
          </div>
          <p className="text-sm text-text-secondary">
            This invoice is now marked paid in this preview. No real payment was processed.
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
              <strong className="font-semibold">This is a demo.</strong> No real payment will be processed and no
              card details are collected here. Confirming will simply mark this invoice as paid in this preview.
            </p>
          </div>
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
                "Confirm (demo)"
              )}
            </Button>
          </div>
        </div>
      )}
    </Modal>
  );
}
