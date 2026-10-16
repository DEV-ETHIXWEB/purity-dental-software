"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useCan } from "@/components/auth/Permissions";
import { markInvoicePaid } from "@/lib/actions/mark-invoice-paid";

/**
 * Invoice detail page's "Mark as Paid" — `markInvoicePaid` itself was
 * already fully implemented (role-checked, transactional, decrements
 * `Patient.balanceCents`) and used by `InvoicesTable`'s row actions; this
 * just gives the detail panel its own trigger, refreshing the server-
 * rendered page afterward so the status badge/totals update in place.
 */
export function MarkInvoicePaidButton({ invoiceId }: { invoiceId: string }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState(false);
  const can = useCan();

  /*
   * Recording a payment is `billing.recordPayment`. Without it the action
   * refuses the click, so the button should not be here to click — a
   * hygienist whose practice keeps payments at the front desk sees the
   * invoice and its status, just not a way to settle it.
   */
  if (!can("billing.recordPayment")) return null;

  async function handleClick() {
    setPending(true);
    setError(false);
    const result = await markInvoicePaid(invoiceId);
    setPending(false);
    if (result.ok) {
      router.refresh();
    } else {
      setError(true);
    }
  }

  return (
    <Button onClick={handleClick} disabled={pending} size="sm">
      {pending ? (
        <Loader2 className="h-4 w-4 animate-spin motion-reduce:animate-none" aria-hidden="true" />
      ) : (
        <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
      )}
      {pending ? "Marking paid…" : error ? "Try again" : "Mark as Paid"}
    </Button>
  );
}
