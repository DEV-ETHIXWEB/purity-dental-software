"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { BillingIconFilled } from "@/components/ui/icons/purity-icons";
import { InvoiceCard } from "@/components/patient/InvoiceCard";
import { EmptyState } from "@/components/patient/EmptyState";
import { PayBalanceModal } from "@/components/patient/PayBalanceModal";
import { Button } from "@/components/ui/Button";
import type { InvoiceWithDetails } from "@/lib/data/billing";

export function PatientBillingView({ initialInvoices }: { initialInvoices: InvoiceWithDetails[] }) {
  const router = useRouter();
  const [payTarget, setPayTarget] = useState<InvoiceWithDetails | null>(null);

  function handleConfirmed() {
    setPayTarget(null);
    router.refresh();
  }

  if (initialInvoices.length === 0) {
    return (
      <EmptyState
        icon={BillingIconFilled}
        title="No bills yet"
        description="Invoices from your visits will show up here."
      />
    );
  }

  return (
    <>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {initialInvoices.map((invoice) => {
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
        onClose={() => setPayTarget(null)}
        onConfirmed={handleConfirmed}
      />
    </>
  );
}
