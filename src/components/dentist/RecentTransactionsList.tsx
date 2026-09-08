import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/cn";
import { Avatar } from "@/components/ui/Avatar";
import { InvoiceStatusBadge } from "@/components/dentist/InvoiceStatusBadge";
import { PaymentMethodChip } from "@/components/ui/icons/payment-icons";
import { patientFullName } from "@/lib/patient-format";
import { formatCentsAsCurrency, invoiceNumber } from "@/lib/billing-format";
import type { InvoiceWithDetails } from "@/lib/data/billing";

export interface RecentTransactionsListProps {
  invoices: InvoiceWithDetails[];
  /** Portal route prefix for invoice detail links (e.g. "/hygienist"). Defaults to the Dentist portal's root. */
  basePath?: string;
}

const STAGGER = ["stagger-0", "stagger-1", "stagger-2", "stagger-3", "stagger-4", "stagger-5"];

/**
 * Recent invoice activity. Deliberately still a Server Component: the row
 * hover state is expressed entirely with `group-hover:` utilities and the
 * entry animation with named stagger classes, so none of the interaction
 * needs client-side JavaScript.
 *
 * The invoice link is stretched over the whole row (`absolute inset-0`) so
 * the row is clickable end-to-end while the accessible name stays on the
 * patient's name — the surrounding chips and badges are non-interactive,
 * so nothing is swallowed by the overlay.
 */
export function RecentTransactionsList({ invoices, basePath = "" }: RecentTransactionsListProps) {
  return (
    <ul className="divide-y divide-border">
      {invoices.map((invoice, i) => (
        <li
          key={invoice.id}
          className={cn(
            "animate-rise-in group relative flex items-center gap-2 rounded-[var(--radius-lg)] px-2 py-3 transition-colors duration-200 ease-out sm:gap-3",
            "-mx-2 hover:bg-surface-muted focus-within:bg-surface-muted",
            STAGGER[i] ?? "stagger-5",
          )}
        >
          <Avatar
            name={patientFullName(invoice.patient)}
            src={invoice.patient.photoUrl}
            size="sm"
            className="transition-transform duration-200 ease-out group-hover:scale-105"
          />
          <div className="min-w-0 flex-1">
            <Link
              href={`${basePath}/billing/invoices/${invoice.id}`}
              className="block truncate text-sm font-medium text-text-primary transition-colors duration-200 ease-out group-hover:text-[var(--color-brand-blue-text)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-brand-blue)] rounded-[var(--radius-sm)] before:absolute before:inset-0 before:content-['']"
            >
              {patientFullName(invoice.patient)}
            </Link>
            <p className="truncate text-xs text-text-secondary">
              {invoiceNumber(invoice)} · {invoice.issuedAt.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
            </p>
          </div>
          <PaymentMethodChip method={invoice.paymentMethod} last4={invoice.paymentMethodLast4} className="hidden sm:inline-flex" />
          <span className="shrink-0 text-sm font-medium tabular-nums text-text-primary">
            {formatCentsAsCurrency(invoice.totalCents)}
          </span>
          <InvoiceStatusBadge status={invoice.status} className="shrink-0" />
          {/* Affordance only — the stretched link above is what navigates. */}
          <ChevronRight
            className="hidden h-4 w-4 shrink-0 -translate-x-1 text-text-secondary opacity-0 transition-all duration-200 ease-out group-hover:translate-x-0 group-hover:opacity-100 sm:block"
            aria-hidden="true"
          />
        </li>
      ))}
    </ul>
  );
}
