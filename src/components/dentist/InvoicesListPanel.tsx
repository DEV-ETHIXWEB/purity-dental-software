"use client";

import { useMemo, useState } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { Search } from "lucide-react";
import { Avatar } from "@/components/ui/Avatar";
import { InvoiceStatusBadge } from "@/components/dentist/InvoiceStatusBadge";
import { NewInvoiceModal } from "@/components/dentist/NewInvoiceModal";
import { patientFullName } from "@/lib/patient-format";
import { formatCentsAsCurrency, invoiceNumber } from "@/lib/billing-format";
import { cn } from "@/lib/cn";
import type { InvoiceWithDetails } from "@/lib/data/billing";
import type { InvoiceStatus, Patient } from "@/generated/prisma/client";

const PAGE_SIZE = 7;
const FILTERS: { label: string; value: InvoiceStatus | "ALL" }[] = [
  { label: "All", value: "ALL" },
  { label: "Paid", value: "PAID" },
  { label: "Pending", value: "PENDING" },
  { label: "Overdue", value: "OVERDUE" },
];

export interface InvoicesListPanelProps {
  invoices: InvoiceWithDetails[];
  /** Org patients, for the "+ New Invoice" patient picker. */
  patients: Patient[];
}

/**
 * The master half of the Invoices master-detail view (`layout.tsx` renders
 * this beside `{children}` — the detail route). Filter/pagination logic
 * adapted from `InvoicesTable.tsx`, but this is a separate component, not a
 * rewrite of it — the Hygienist/Receptionist portals still use the original
 * flat table, unaffected.
 */
export function InvoicesListPanel({ invoices, patients }: InvoicesListPanelProps) {
  const pathname = usePathname();
  const [filter, setFilter] = useState<InvoiceStatus | "ALL">("ALL");
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
    let result = filter === "ALL" ? invoices : invoices.filter((inv) => inv.status === filter);
    const q = query.trim().toLowerCase();
    if (q) {
      result = result.filter(
        (inv) =>
          invoiceNumber(inv).toLowerCase().includes(q) || patientFullName(inv.patient).toLowerCase().includes(q),
      );
    }
    return result;
  }, [invoices, filter, query]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const start = (currentPage - 1) * PAGE_SIZE;
  const pageItems = filtered.slice(start, start + PAGE_SIZE);

  return (
    <div className="flex h-full flex-col gap-4 p-4">
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-sm font-semibold text-text-primary">Invoices</h2>
        <NewInvoiceModal patients={patients} />
      </div>

      <div className="relative">
        <Search
          className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-secondary"
          aria-hidden="true"
        />
        <label htmlFor="invoice-search" className="sr-only">
          Search invoices
        </label>
        <input
          id="invoice-search"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setPage(1);
          }}
          type="search"
          placeholder="Search invoices…"
          className="h-9 w-full rounded-[var(--radius-md)] border border-border bg-surface-muted pl-9 pr-3 text-sm text-text-primary placeholder:text-text-secondary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-brand-blue)]"
        />
      </div>

      <div role="tablist" aria-label="Filter invoices by status" className="flex flex-wrap gap-1.5">
        {FILTERS.map((f) => (
          <button
            key={f.value}
            type="button"
            role="tab"
            aria-selected={filter === f.value}
            onClick={() => {
              setFilter(f.value);
              setPage(1);
            }}
            className={cn(
              "rounded-[var(--radius-md)] px-3 py-1.5 text-xs font-medium transition-colors",
              "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-brand-blue)]",
              filter === f.value
                ? "bg-surface-sunken text-text-primary"
                : "text-text-secondary hover:text-text-primary",
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      <ul className="flex-1 divide-y divide-border overflow-y-auto">
        {pageItems.map((invoice) => {
          const isActive = pathname === `/billing/invoices/${invoice.id}`;
          return (
            <li key={invoice.id}>
              <Link
                href={`/billing/invoices/${invoice.id}`}
                aria-current={isActive ? "page" : undefined}
                className={cn(
                  "flex items-center gap-3 rounded-[var(--radius-md)] px-2 py-3 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-brand-blue)]",
                  isActive ? "bg-surface-sunken" : "hover:bg-surface-muted",
                )}
              >
                <Avatar name={patientFullName(invoice.patient)} src={invoice.patient.photoUrl} size="sm" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-text-primary">{patientFullName(invoice.patient)}</p>
                  <p className="truncate text-xs text-text-secondary">
                    {invoiceNumber(invoice)} ·{" "}
                    {invoice.issuedAt.toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                  </p>
                </div>
                <div className="flex shrink-0 flex-col items-end gap-1">
                  <span className="text-sm font-medium text-text-primary">
                    {formatCentsAsCurrency(invoice.totalCents)}
                  </span>
                  <InvoiceStatusBadge status={invoice.status} />
                </div>
              </Link>
            </li>
          );
        })}
        {pageItems.length === 0 && <p className="py-8 text-center text-sm text-text-secondary">No invoices match.</p>}
      </ul>

      {totalPages > 1 && (
        <div className="flex items-center justify-between gap-2 border-t border-border pt-3">
          <p className="text-xs text-text-secondary">
            Showing {start + 1}–{Math.min(start + PAGE_SIZE, filtered.length)} of {filtered.length}
          </p>
          <div className="flex gap-1">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => setPage(n)}
                aria-current={n === currentPage ? "page" : undefined}
                className={cn(
                  "flex h-7 w-7 items-center justify-center rounded-[var(--radius-md)] text-xs font-medium focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-brand-blue)]",
                  n === currentPage
                    ? "bg-[var(--color-brand-blue)] text-white"
                    : "text-text-secondary hover:bg-surface-muted",
                )}
              >
                {n}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
