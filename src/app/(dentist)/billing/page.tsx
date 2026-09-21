import type { Metadata } from "next";
import Link from "next/link";
import { Wallet, Clock, CheckCircle2, AlertTriangle } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { StatStrip } from "@/components/ui/StatStrip";
import { CashflowTrendChart } from "@/components/dentist/CashflowTrendChart";
import { CashflowRangeSelect, type CashflowRange } from "@/components/dentist/CashflowRangeSelect";
import { CollectionRateRing } from "@/components/dentist/CollectionRateRing";
import { OutstandingByAgeChart } from "@/components/dentist/OutstandingByAgeChart";
import { RecentTransactionsList } from "@/components/dentist/RecentTransactionsList";
import { requirePageRole } from "@/lib/auth/require-portal";
import { billingSummary, cashflowTrend, outstandingByAge, listInvoices } from "@/lib/data/billing";
import { formatCentsAsCurrency } from "@/lib/billing-format";

export const metadata: Metadata = {
  title: "Billing",
  description: "Revenue, outstanding balances, and collection performance overview.",
};

export default async function BillingDashboardPage({ searchParams }: PageProps<"/billing">) {
  const session = await requirePageRole(["DENTIST", "ADMIN"]);
  const { organizationId } = session.user;
  const { range: rangeParam } = await searchParams;
  const range: CashflowRange = rangeParam === "last12Months" ? "last12Months" : "thisYear";

  const [summary, trend, byAge, invoices] = await Promise.all([
    billingSummary(organizationId),
    cashflowTrend(organizationId, range),
    outstandingByAge(organizationId),
    listInvoices(organizationId),
  ]);
  const recent = invoices.slice(0, 5);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-text-primary">Billing</h1>
          <p className="text-sm text-text-secondary">Overview of your practice&apos;s revenue and collections.</p>
        </div>
        <Link
          href="/billing/invoices"
          className="inline-flex h-10 items-center rounded-[var(--radius-lg)] border border-border bg-transparent px-4 text-sm font-medium text-text-primary transition-colors hover:bg-surface-muted focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-brand-blue)]"
        >
          View Invoices
        </Link>
      </div>

      <StatStrip
        variant="badge"
        items={[
          {
            label: "Total Revenue",
            value: formatCentsAsCurrency(summary.totalRevenue.value),
            icon: Wallet,
            iconTone: "blue",
            deltaPct: summary.totalRevenue.deltaPct,
          },
          {
            label: "Outstanding Balance",
            value: formatCentsAsCurrency(summary.outstanding.value),
            icon: Clock,
            iconTone: "teal",
            deltaPct: summary.outstanding.deltaPct,
          },
          {
            label: "Collected This Month",
            value: formatCentsAsCurrency(summary.collected.value),
            icon: CheckCircle2,
            iconTone: "teal",
            deltaPct: summary.collected.deltaPct,
          },
          {
            label: "Overdue Amount",
            value: formatCentsAsCurrency(summary.overdue.value),
            icon: AlertTriangle,
            iconTone: "error",
            deltaPct: summary.overdue.deltaPct,
          },
        ]}
      />

      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Cashflow Trend</CardTitle>
            <CashflowRangeSelect value={range} />
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
            <CollectionRateRing
              percent={summary.collectionRate}
              legend={{ collectedCents: summary.collected.value, outstandingCents: summary.outstanding.value }}
            />
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 items-start gap-6 md:grid-cols-2">
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
            <RecentTransactionsList invoices={recent} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
