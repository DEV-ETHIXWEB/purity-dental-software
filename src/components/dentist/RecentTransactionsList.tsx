import Link from "next/link";
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

export function RecentTransactionsList({ invoices, basePath = "" }: RecentTransactionsListProps) {
  return (
    <ul className="divide-y divide-border">
      {invoices.map((invoice) => (
        <li key={invoice.id} className="flex items-center gap-3 py-3">
          <Avatar name={patientFullName(invoice.patient)} src={invoice.patient.photoUrl} size="sm" />
          <div className="min-w-0 flex-1">
            <Link
              href={`${basePath}/billing/invoices/${invoice.id}`}
              className="truncate text-sm font-medium text-text-primary hover:text-[var(--color-brand-blue-text)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-brand-blue)] rounded-[var(--radius-sm)]"
            >
              {patientFullName(invoice.patient)}
            </Link>
            <p className="truncate text-xs text-text-secondary">
              {invoiceNumber(invoice)} · {invoice.issuedAt.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
            </p>
          </div>
          <PaymentMethodChip method={invoice.paymentMethod} last4={invoice.paymentMethodLast4} className="hidden sm:inline-flex" />
          <span className="text-sm font-medium text-text-primary">
            {formatCentsAsCurrency(invoice.totalCents)}
          </span>
          <InvoiceStatusBadge status={invoice.status} />
        </li>
      ))}
    </ul>
  );
}
