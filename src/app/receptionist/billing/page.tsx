import type { Metadata } from "next";
import { Wallet } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { StatStrip } from "@/components/ui/StatStrip";
import { DollarIconFilled } from "@/components/ui/icons/purity-icons";
import { InvoicesTable } from "@/components/dentist/InvoicesTable";
import { requireRole } from "@/lib/auth/authorize";
import { billingSummary, listInvoices } from "@/lib/data/billing";
import { formatCentsAsCurrency } from "@/lib/billing-format";

export const metadata: Metadata = {
  title: "Billing",
  description: "Outstanding invoices and quick payment collection actions.",
};

export default async function ReceptionistBillingPage() {
  const session = await requireRole(["RECEPTIONIST", "ADMIN"]);
  const { organizationId } = session.user;

  const [summary, invoices] = await Promise.all([
    billingSummary(organizationId),
    listInvoices(organizationId),
  ]);
  const outstandingCount = invoices.filter(
    (i) => i.status === "PENDING" || i.status === "OVERDUE",
  ).length;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-surface-muted">
          <DollarIconFilled className="h-5 w-5" aria-hidden="true" />
        </span>
        <div>
          <h1 className="text-2xl font-semibold text-text-primary">Billing</h1>
          <p className="text-sm text-text-secondary">
            Collect payments and send reminders for outstanding balances.
          </p>
        </div>
      </div>

      <StatStrip
        items={[
          {
            label: `Outstanding across ${outstandingCount} invoice${outstandingCount === 1 ? "" : "s"}`,
            value: formatCentsAsCurrency(summary.outstanding.value),
            icon: Wallet,
            tone: summary.outstanding.value > 0 ? "warning" : "default",
          },
        ]}
        className="sm:max-w-xs"
      />

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
