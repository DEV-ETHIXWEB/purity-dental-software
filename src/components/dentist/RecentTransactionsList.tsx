import Link from "next/link";
import { Avatar } from "@/components/ui/Avatar";
import { InvoiceStatusBadge } from "@/components/dentist/InvoiceStatusBadge";
import {
  type SampleInvoice,
  getPatientById,
  patientFullName,
  invoiceTotalCents,
  formatCentsAsCurrency,
} from "@/lib/sample-data";

export interface RecentTransactionsListProps {
  invoices: SampleInvoice[];
  /** Portal route prefix for invoice detail links (e.g. "/hygienist"). Defaults to the Dentist portal's root. */
  basePath?: string;
}

export function RecentTransactionsList({ invoices, basePath = "" }: RecentTransactionsListProps) {
  return (
    <ul className="divide-y divide-border">
      {invoices.map((invoice) => {
        const patient = getPatientById(invoice.patientId);
        return (
          <li key={invoice.id} className="flex items-center gap-3 py-3">
            {patient && <Avatar name={patientFullName(patient)} src={patient.photoUrl} size="sm" />}
            <div className="min-w-0 flex-1">
              <Link
                href={`${basePath}/billing/invoices/${invoice.id}`}
                className="truncate text-sm font-medium text-text-primary hover:text-[var(--color-brand-blue-text)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-brand-blue)] rounded-[var(--radius-sm)]"
              >
                {patient ? patientFullName(patient) : "Unknown patient"}
              </Link>
              <p className="truncate text-xs text-text-secondary">{invoice.invoiceNumber}</p>
            </div>
            <span className="text-sm font-medium text-text-primary">
              {formatCentsAsCurrency(invoiceTotalCents(invoice))}
            </span>
            <InvoiceStatusBadge status={invoice.status} />
          </li>
        );
      })}
    </ul>
  );
}
