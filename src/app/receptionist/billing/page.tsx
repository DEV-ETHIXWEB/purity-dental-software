import type { Metadata } from "next";
import { Wallet } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { InvoicesTable } from "@/components/dentist/InvoicesTable";
import { billingSummary, invoices, formatCentsAsCurrency } from "@/lib/sample-data";

export const metadata: Metadata = {
  title: "Billing",
  description: "Outstanding invoices and quick payment collection actions.",
};

export default function ReceptionistBillingPage() {
  const summary = billingSummary();
  const outstandingCount = invoices.filter(
    (i) => i.status === "PENDING" || i.status === "OVERDUE",
  ).length;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold text-text-primary">Billing</h1>
        <p className="text-sm text-text-secondary">
          Collect payments and send reminders for outstanding balances.
        </p>
      </div>

      <Card>
        <CardContent className="flex items-center gap-4">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[var(--radius-lg)] bg-warning-bg text-warning-text">
            <Wallet className="h-5 w-5" aria-hidden="true" />
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm text-text-secondary">
              Outstanding across {outstandingCount} invoice{outstandingCount === 1 ? "" : "s"}
            </p>
            <p className="truncate text-xl font-semibold text-text-primary">
              {formatCentsAsCurrency(summary.outstanding)}
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Invoices</CardTitle>
        </CardHeader>
        <CardContent>
          <InvoicesTable invoices={invoices} basePath="/receptionist" />
        </CardContent>
      </Card>
    </div>
  );
}
