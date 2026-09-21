"use client";

import { useState, type ComponentType } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import {
  BillingIconFilled,
  DocumentIconFilled,
  CreditCardIconFilled,
  DollarIconFilled,
  ChatIconFilled,
  ToothIconFilled,
  type PurityIconProps,
} from "@/components/ui/icons/purity-icons";
import { InsuranceIcon, HeadsetIcon } from "@/components/ui/icons/purity-raster-icons";
import { InvoiceCard } from "@/components/patient/InvoiceCard";
import { EmptyState } from "@/components/patient/EmptyState";
import { PayBalanceModal } from "@/components/patient/PayBalanceModal";
import { BillingOverviewCard } from "@/components/patient/BillingOverviewCard";
import { formatShortDate } from "@/components/patient/formatters";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/cn";
import { formatCentsAsCurrency, invoiceNumber } from "@/lib/billing-format";
import type { InvoiceWithDetails, PatientBillingOverview } from "@/lib/data/billing";

const TILE_CLASSES =
  "group flex h-full min-h-11 items-center gap-2.5 rounded-[var(--radius-lg)] border border-border p-3 text-left transition-all duration-200 ease-out hover:-translate-y-0.5 hover:border-border-strong hover:bg-surface-muted hover:shadow-card active:scale-[0.97] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-brand-blue)] motion-reduce:hover:translate-y-0 motion-reduce:active:scale-100";

const TILE_ICON_CLASSES =
  "h-5 w-5 shrink-0 transition-transform duration-200 ease-out group-hover:scale-110 motion-reduce:group-hover:scale-100";

function TileLabel({ children }: { children: string }) {
  return <span className="text-[13px] font-medium leading-snug text-text-primary">{children}</span>;
}

export interface PatientBillingViewProps {
  initialInvoices: InvoiceWithDetails[];
  overview: PatientBillingOverview;
}

/**
 * Patient Bills screen: what's owed and what insurance covers up top, then
 * shortcuts, then the invoices themselves split into outstanding vs. paid.
 *
 * Every shortcut resolves to something on this page or to a real modal —
 * none of them are placeholders for screens that don't exist. "Make
 * payment" is disabled outright when there's nothing payable rather than
 * opening an empty modal.
 */
export function PatientBillingView({ initialInvoices, overview }: PatientBillingViewProps) {
  const router = useRouter();
  const [payTarget, setPayTarget] = useState<InvoiceWithDetails | null>(null);

  const outstanding = initialInvoices.filter(
    (i) => i.status === "PENDING" || i.status === "OVERDUE",
  );
  const settled = initialInvoices.filter((i) => i.status === "PAID");

  // Oldest unpaid invoice — the one "Make payment" should act on.
  const nextPayable = [...outstanding].sort((a, b) => a.dueAt.getTime() - b.dueAt.getTime())[0];

  function handleConfirmed() {
    setPayTarget(null);
    router.refresh();
  }

  const tiles: { label: string; Icon: ComponentType<PurityIconProps>; href?: string; onClick?: () => void; disabled?: boolean }[] = [
    { label: "View invoices", Icon: DocumentIconFilled, href: "#invoices" },
    {
      label: "Make payment",
      Icon: CreditCardIconFilled,
      onClick: () => nextPayable && setPayTarget(nextPayable),
      disabled: !nextPayable,
    },
    { label: "Insurance info", Icon: DollarIconFilled, href: "#insurance" },
    { label: "Payment history", Icon: BillingIconFilled, href: "#history" },
  ];

  return (
    <>
      <BillingOverviewCard overview={overview} />

      <section aria-labelledby="quick-access" className="animate-rise-in stagger-2">
        <h2 id="quick-access" className="text-[15px] font-semibold tracking-tight text-text-primary">
          Quick access
        </h2>
        <ul className="mt-3 grid grid-cols-2 gap-2.5 sm:grid-cols-4">
          {tiles.map(({ label, Icon, href, onClick, disabled }) => (
            <li key={label}>
              {href ? (
                <Link href={href} className={TILE_CLASSES}>
                  <Icon className={TILE_ICON_CLASSES} aria-hidden="true" />
                  <TileLabel>{label}</TileLabel>
                </Link>
              ) : (
                <button
                  type="button"
                  onClick={onClick}
                  disabled={disabled}
                  className={cn(TILE_CLASSES, "w-full disabled:pointer-events-none disabled:opacity-50")}
                >
                  <Icon className={TILE_ICON_CLASSES} aria-hidden="true" />
                  <TileLabel>{label}</TileLabel>
                </button>
              )}
            </li>
          ))}
        </ul>
      </section>

      <section id="invoices" aria-labelledby="invoices-heading" className="animate-rise-in stagger-3 scroll-mt-4">
        <h2 id="invoices-heading" className="text-[15px] font-semibold tracking-tight text-text-primary">
          Your invoices
        </h2>
        <div className="mt-3">
          {outstanding.length > 0 ? (
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              {outstanding.map((invoice) => (
                <InvoiceCard
                  key={invoice.id}
                  invoice={invoice}
                  action={
                    <Button size="sm" className="min-h-11" onClick={() => setPayTarget(invoice)}>
                      Pay balance
                    </Button>
                  }
                />
              ))}
            </div>
          ) : (
            <EmptyState
              icon={BillingIconFilled}
              title={initialInvoices.length === 0 ? "No bills yet" : "Nothing outstanding"}
              description={
                initialInvoices.length === 0
                  ? "Invoices from your visits will show up here."
                  : "Every invoice on your account is settled."
              }
            />
          )}
        </div>
      </section>

      <section id="history" aria-labelledby="history-heading" className="animate-rise-in stagger-4 scroll-mt-4">
        <h2 id="history-heading" className="text-[15px] font-semibold tracking-tight text-text-primary">
          Payment history
        </h2>
        <Card className="mt-3 transition-shadow duration-300 ease-out hover:shadow-card-hover">
          <CardContent className="p-2">
            {settled.length > 0 ? (
              <ul className="divide-y divide-border">
                {settled.map((invoice) => (
                  <li
                    key={invoice.id}
                    className="flex items-center gap-3 px-2 py-3 transition-colors duration-200 ease-out hover:bg-surface-muted"
                  >
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-surface-muted">
                      <ToothIconFilled className="h-[18px] w-[18px]" aria-hidden="true" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-text-primary">
                        {invoice.lineItems[0]?.description ?? "Treatment"}
                      </p>
                      <p className="truncate text-xs text-text-secondary">
                        {invoiceNumber(invoice)} • {formatShortDate(invoice.issuedAt)}
                      </p>
                    </div>
                    <div className="shrink-0 text-right">
                      <p className="text-sm font-semibold text-text-primary">
                        {formatCentsAsCurrency(invoice.totalCents)}
                      </p>
                      <Badge tone="success" className="mt-0.5">
                        Paid
                      </Badge>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="px-2 py-6 text-center text-sm text-text-secondary">
                Payments you make will be listed here.
              </p>
            )}
          </CardContent>
        </Card>
      </section>

      <section id="insurance" aria-labelledby="insurance-heading" className="animate-rise-in stagger-5 scroll-mt-4">
        <h2 id="insurance-heading" className="text-[15px] font-semibold tracking-tight text-text-primary">
          Insurance
        </h2>
        <Card className="mt-3 transition-shadow duration-300 ease-out hover:shadow-card-hover">
          <CardContent className="flex flex-col gap-3">
            {overview.insurance.provider ? (
              <dl className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <dt className="text-xs text-text-secondary">Provider</dt>
                  <dd className="text-sm font-medium text-text-primary">
                    {overview.insurance.provider}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs text-text-secondary">Plan</dt>
                  <dd className="text-sm font-medium text-text-primary">
                    {overview.insurance.plan ?? "—"}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs text-text-secondary">Annual maximum</dt>
                  <dd className="text-sm font-medium text-text-primary">
                    {overview.insurance.annualMaxCents == null
                      ? "Not on file"
                      : formatCentsAsCurrency(overview.insurance.annualMaxCents)}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs text-text-secondary">Used this year</dt>
                  <dd className="text-sm font-medium text-text-primary">
                    {formatCentsAsCurrency(overview.insurance.usedCents)}
                  </dd>
                </div>
              </dl>
            ) : (
              <EmptyState
                icon={InsuranceIcon}
                title="No insurance on file"
                description="Add your plan details and we'll track your annual benefit here."
              />
            )}
          </CardContent>
        </Card>
      </section>

      <Card className="animate-rise-in stagger-6 transition-shadow duration-300 ease-out hover:shadow-card-hover">
        <CardHeader className="justify-start gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-surface-muted">
            <HeadsetIcon className="h-5 w-5" aria-hidden="true" />
          </span>
          <CardTitle>Need help with billing?</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <p className="text-sm text-text-secondary">
            Our team is here to help you with any questions about an invoice or your coverage.
          </p>
          <Link
            href="/patient/messages"
            className="cta-gradient-slide inline-flex min-h-11 items-center justify-center gap-2 self-start rounded-[var(--radius-lg)] px-4 text-sm font-medium text-white shadow-card transition-transform duration-200 ease-out active:scale-[0.97] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-brand-blue)] motion-reduce:active:scale-100"
          >
            <ChatIconFilled className="h-4 w-4" aria-hidden="true" />
            Message us
          </Link>
        </CardContent>
      </Card>

      <PayBalanceModal
        invoice={payTarget}
        onClose={() => setPayTarget(null)}
        onConfirmed={handleConfirmed}
      />
    </>
  );
}
