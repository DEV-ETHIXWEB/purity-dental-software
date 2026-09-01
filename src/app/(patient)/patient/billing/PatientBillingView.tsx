"use client";

import { useState } from "react";
import { Receipt } from "lucide-react";
import { InvoiceCard } from "@/components/patient/InvoiceCard";
import { EmptyState } from "@/components/patient/EmptyState";
import { PayBalanceModal } from "@/components/patient/PayBalanceModal";
import { Button } from "@/components/ui/Button";
import { invoiceTotalCents, type SampleInvoice } from "@/lib/sample-data";

export function PatientBillingView({ initialInvoices }: { initialInvoices: SampleInvoice[] }) {
  const [invoices, setInvoices] = useState(initialInvoices);
  const [payTarget, setPayTarget] = useState<SampleInvoice | null>(null);

  function handleConfirmed(invoiceId: string) {
    setInvoices((prev) =>
      prev.map((inv) => (inv.id === invoiceId ? { ...inv, status: "PAID" as const } : inv)),
    );
  }

  if (invoices.length === 0) {
    return (
      <EmptyState
        icon={Receipt}
        title="No bills yet"
        description="Invoices from your visits will show up here."
      />
    );
  }

  return (
    <>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {invoices.map((invoice) => {
          const payable = invoice.status === "PENDING" || invoice.status === "OVERDUE";
          return (
            <InvoiceCard
              key={invoice.id}
              invoice={invoice}
              action={
                payable ? (
                  <Button size="sm" className="min-h-11" onClick={() => setPayTarget(invoice)}>
                    Pay balance
                  </Button>
                ) : undefined
              }
            />
          );
        })}
      </div>

      <PayBalanceModal
        invoice={payTarget}
        totalCents={payTarget ? invoiceTotalCents(payTarget) : 0}
        onClose={() => setPayTarget(null)}
        onConfirmed={handleConfirmed}
      />
    </>
  );
}
