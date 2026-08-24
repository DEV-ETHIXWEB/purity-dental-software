import type { Metadata } from "next";
import Link from "next/link";
import { DollarSign, Clock, CheckCircle2, AlertTriangle } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { BillingKpiCard } from "@/components/dentist/BillingKpiCard";
import { CashflowTrendChart } from "@/components/dentist/CashflowTrendChart";
import { CollectionRateRing } from "@/components/dentist/CollectionRateRing";
import { OutstandingByAgeChart } from "@/components/dentist/OutstandingByAgeChart";
import { RecentTransactionsList } from "@/components/dentist/RecentTransactionsList";
import {
  billingSummary,
  cashflowTrend,
  outstandingByAge,
  invoices,
  formatCentsAsCurrency,
} from "@/lib/sample-data";

export const metadata: Metadata = {
  title: "Billing",
  description: "Revenue, outstanding balances, and collection performance overview.",
};

export default function HygienistBillingDashboardPage() {
  const summary = billingSummary();
  const recent = [...invoices]
    .sort((a, b) => b.issuedAt.localeCompare(a.issuedAt))
    .slice(0, 5);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-text-primary">Billing</h1>
          <p className="text-sm text-text-secondary">Overview of the practice&apos;s revenue and collections.</p>
        </div>
        <Link
          href="/hygienist/billing/invoices"
          className="inline-flex h-10 items-center rounded-[var(--radius-lg)] border border-border bg-transparent px-4 text-sm font-medium text-text-primary transition-colors hover:bg-surface-muted focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-brand-blue)]"
        >
          View Invoices
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <BillingKpiCard label="Total Revenue" value={formatCentsAsCurrency(summary.totalRevenue)} icon={DollarSign} tone="success" />
        <BillingKpiCard label="Outstanding" value={formatCentsAsCurrency(summary.outstanding)} icon={Clock} tone="warning" />
        <BillingKpiCard label="Collected" value={formatCentsAsCurrency(summary.collected)} icon={CheckCircle2} tone="neutral" />
        <BillingKpiCard label="Overdue" value={formatCentsAsCurrency(summary.overdue)} icon={AlertTriangle} tone="error" />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Cashflow Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <CashflowTrendChart data={cashflowTrend()} />
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

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Outstanding by Age</CardTitle>
          </CardHeader>
          <CardContent>
            <OutstandingByAgeChart data={outstandingByAge()} />
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
