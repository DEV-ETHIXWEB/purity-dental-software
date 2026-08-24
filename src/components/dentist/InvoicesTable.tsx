"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { CheckCircle2, Send, Download, ChevronLeft, ChevronRight } from "lucide-react";
import {
  TableContainer,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableHeaderCell,
  TableCell,
} from "@/components/ui/Table";
import { Button } from "@/components/ui/Button";
import { InvoiceStatusBadge } from "@/components/dentist/InvoiceStatusBadge";
import {
  type SampleInvoice,
  type InvoiceStatus,
  getPatientById,
  patientFullName,
  invoiceTotalCents,
  formatCentsAsCurrency,
} from "@/lib/sample-data";
import { cn } from "@/lib/cn";

const PAGE_SIZE = 5;
const FILTERS: { label: string; value: InvoiceStatus | "ALL" }[] = [
  { label: "All", value: "ALL" },
  { label: "Paid", value: "PAID" },
  { label: "Pending", value: "PENDING" },
  { label: "Overdue", value: "OVERDUE" },
];

export interface InvoicesTableProps {
  invoices: SampleInvoice[];
  /** Portal route prefix for invoice detail links (e.g. "/hygienist"). Defaults to the Dentist portal's root. */
  basePath?: string;
}

export function InvoicesTable({ invoices, basePath = "" }: InvoicesTableProps) {
  const [filter, setFilter] = useState<InvoiceStatus | "ALL">("ALL");
  const [page, setPage] = useState(1);
  // Client-only "Marked as Paid" overrides layered on top of the sample data,
  // purely for interactive demo purposes (no persistence yet).
  const [paidOverrides, setPaidOverrides] = useState<Record<string, boolean>>({});
  const [remindedIds, setRemindedIds] = useState<Record<string, boolean>>({});

  const filtered = useMemo(() => {
    const withOverrides = invoices.map((inv) =>
      paidOverrides[inv.id] ? { ...inv, status: "PAID" as const } : inv,
    );
    if (filter === "ALL") return withOverrides;
    return withOverrides.filter((inv) => inv.status === filter);
  }, [invoices, filter, paidOverrides]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pageItems = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  return (
    <div className="flex flex-col gap-4">
      <div role="tablist" aria-label="Filter invoices by status" className="flex flex-wrap gap-2">
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
              "rounded-[var(--radius-md)] px-3.5 py-1.5 text-sm font-medium transition-colors",
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

      <TableContainer>
        <Table>
          <TableHead>
            <TableRow>
              <TableHeaderCell>Invoice</TableHeaderCell>
              <TableHeaderCell>Date</TableHeaderCell>
              <TableHeaderCell>Patient</TableHeaderCell>
              <TableHeaderCell>Amount</TableHeaderCell>
              <TableHeaderCell>Status</TableHeaderCell>
              <TableHeaderCell>
                <span className="sr-only">Actions</span>
              </TableHeaderCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {pageItems.map((invoice) => {
              const patient = getPatientById(invoice.patientId);
              const isPaid = invoice.status === "PAID";
              return (
                <TableRow key={invoice.id}>
                  <TableCell>
                    <Link
                      href={`${basePath}/billing/invoices/${invoice.id}`}
                      className="font-medium text-text-primary hover:text-[var(--color-brand-blue-text)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-brand-blue)] rounded-[var(--radius-sm)]"
                    >
                      {invoice.invoiceNumber}
                    </Link>
                  </TableCell>
                  <TableCell className="text-text-secondary">
                    {new Date(invoice.issuedAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                  </TableCell>
                  <TableCell className="text-text-primary">
                    {patient ? patientFullName(patient) : "Unknown"}
                  </TableCell>
                  <TableCell className="font-medium text-text-primary">
                    {formatCentsAsCurrency(invoiceTotalCents(invoice))}
                  </TableCell>
                  <TableCell>
                    <InvoiceStatusBadge status={invoice.status} />
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center justify-end gap-1">
                      {!isPaid && (
                        <Button
                          size="icon"
                          variant="ghost"
                          aria-label={`Mark ${invoice.invoiceNumber} as paid`}
                          onClick={() => setPaidOverrides((prev) => ({ ...prev, [invoice.id]: true }))}
                        >
                          <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
                        </Button>
                      )}
                      {!isPaid && (
                        <Button
                          size="icon"
                          variant="ghost"
                          aria-label={
                            remindedIds[invoice.id]
                              ? `Reminder sent for ${invoice.invoiceNumber}`
                              : `Send reminder for ${invoice.invoiceNumber}`
                          }
                          onClick={() => setRemindedIds((prev) => ({ ...prev, [invoice.id]: true }))}
                        >
                          <Send className="h-4 w-4" aria-hidden="true" />
                        </Button>
                      )}
                      <Button size="icon" variant="ghost" aria-label={`Download PDF for ${invoice.invoiceNumber}`}>
                        <Download className="h-4 w-4" aria-hidden="true" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>

      {filtered.length === 0 && (
        <p className="py-8 text-center text-sm text-text-secondary">No invoices match this filter.</p>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-text-secondary">
            Page {currentPage} of {totalPages}
          </p>
          <div className="flex gap-2">
            <Button
              size="icon"
              variant="outline"
              aria-label="Previous page"
              disabled={currentPage === 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              <ChevronLeft className="h-4 w-4" aria-hidden="true" />
            </Button>
            <Button
              size="icon"
              variant="outline"
              aria-label="Next page"
              disabled={currentPage === totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            >
              <ChevronRight className="h-4 w-4" aria-hidden="true" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
