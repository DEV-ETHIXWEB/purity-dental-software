import type { Metadata } from "next";
import Link from "next/link";
import { DollarSign, Clock, CheckCircle2, AlertTriangle } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { StatStrip } from "@/components/ui/StatStrip";
import { DollarIconFilled } from "@/components/ui/icons/purity-icons";
import { CashflowTrendChart } from "@/components/dentist/CashflowTrendChart";
import { CollectionRateRing } from "@/components/dentist/CollectionRateRing";
import { OutstandingByAgeChart } from "@/components/dentist/OutstandingByAgeChart";
import { RecentTransactionsList } from "@/components/dentist/RecentTransactionsList";
import { requireRole } from "@/lib/auth/authorize";
import { billingSummary, cashflowTrend, outstandingByAge, listInvoices } from "@/lib/data/billing";
import { formatCentsAsCurrency } from "@/lib/billing-format";

export const metadata: Metadata = {
  title: "Billing",
  description: "Revenue, outstanding balances, and collection performance overview.",
};

export default async function HygienistBillingDashboardPage() {
  const session = await requireRole(["HYGIENIST", "ADMIN"]);
  const { organizationId } = session.user;

  const [summary, trend, byAge, invoices] = await Promise.all([
    billingSummary(organizationId),
    cashflowTrend(organizationId),
    outstandingByAge(organizationId),
    listInvoices(organizationId),
  ]);
  const recent = invoices.slice(0, 5);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-surface-muted">
            <DollarIconFilled className="h-5 w-5" aria-hidden="true" />
          </span>
          <div>
            <h1 className="text-2xl font-semibold text-text-primary">Billing</h1>
            <p className="text-sm text-text-secondary">Overview of the practice&apos;s revenue and collections.</p>
          </div>
        </div>
        <Link
          href="/hygienist/billing/invoices"
          className="inline-flex h-10 items-center rounded-[var(--radius-lg)] border border-border bg-transparent px-4 text-sm font-medium text-text-primary transition-colors hover:bg-surface-muted focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-brand-blue)]"
        >
          View Invoices
        </Link>
      </div>

      <StatStrip
        items={[
          { label: "Total Revenue", value: formatCentsAsCurrency(summary.totalRevenue.value), icon: DollarSign },
          { label: "Outstanding", value: formatCentsAsCurrency(summary.outstanding.value), icon: Clock, tone: summary.outstanding.value > 0 ? "warning" : "default" },
          { label: "Collected", value: formatCentsAsCurrency(summary.collected.value), icon: CheckCircle2, tone: "success" },
          { label: "Overdue", value: formatCentsAsCurrency(summary.overdue.value), icon: AlertTriangle, tone: summary.overdue.value > 0 ? "error" : "default" },
        ]}
      />

      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Cashflow Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <CashflowTrendChart data={trend} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Collection Rate</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center justify-center">
            <CollectionRateRing percent={summary.collectionRate} />
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Outstanding by Age</CardTitle>
          </CardHeader>
          <CardContent>
            <OutstandingByAgeChart data={byAge} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Transactions</CardTitle>
          </CardHeader>
          <CardContent>
            <RecentTransactionsList invoices={recent} basePath="/hygienist" />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
