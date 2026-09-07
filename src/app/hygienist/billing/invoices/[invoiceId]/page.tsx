import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { InvoiceStatusBadge } from "@/components/dentist/InvoiceStatusBadge";
import { SendInvoiceReminderButton } from "@/components/dentist/SendInvoiceReminderButton";
import {
  TableContainer,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableHeaderCell,
  TableCell,
} from "@/components/ui/Table";
import { requireRole } from "@/lib/auth/authorize";
import { getInvoiceById } from "@/lib/data/billing";
import { formatCentsAsCurrency, invoiceNumber } from "@/lib/billing-format";
import { patientFullName } from "@/lib/patient-format";

export async function generateMetadata({
  params,
}: PageProps<"/hygienist/billing/invoices/[invoiceId]">): Promise<Metadata> {
  const session = await requireRole(["HYGIENIST", "ADMIN"]);
  const { invoiceId } = await params;
  const invoice = await getInvoiceById(session.user.organizationId, invoiceId);
  return {
    title: invoice ? invoiceNumber(invoice) : "Invoice not found",
    description: invoice ? `Line items and payment status for ${invoiceNumber(invoice)}.` : undefined,
  };
}

export default async function HygienistInvoiceDetailPage({
  params,
}: PageProps<"/hygienist/billing/invoices/[invoiceId]">) {
  const session = await requireRole(["HYGIENIST", "ADMIN"]);
  const { invoiceId } = await params;
  const invoice = await getInvoiceById(session.user.organizationId, invoiceId);
  if (!invoice) notFound();

  const total = invoice.totalCents;

  return (
    <div className="flex flex-col gap-6">
      <Link
        href="/hygienist/billing/invoices"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-text-secondary hover:text-text-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-brand-blue)] rounded-[var(--radius-sm)] w-fit"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        Back to invoices
      </Link>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-semibold text-text-primary">{invoiceNumber(invoice)}</h1>
            <InvoiceStatusBadge status={invoice.status} />
          </div>
          <p className="text-sm text-text-secondary">
            Billed to {patientFullName(invoice.patient)}
          </p>
        </div>
        {invoice.status !== "PAID" && (
          <div className="flex gap-2">
            <SendInvoiceReminderButton invoice={invoice} />
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Line Items</CardTitle>
          </CardHeader>
          <CardContent>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableHeaderCell>Description</TableHeaderCell>
                    <TableHeaderCell>Code</TableHeaderCell>
                    <TableHeaderCell>Qty</TableHeaderCell>
                    <TableHeaderCell>Unit Price</TableHeaderCell>
                    <TableHeaderCell>Amount</TableHeaderCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {invoice.lineItems.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="text-text-primary">{item.description}</TableCell>
                      <TableCell className="text-text-secondary">{item.procedureCode}</TableCell>
                      <TableCell className="text-text-secondary">{item.quantity}</TableCell>
                      <TableCell className="text-text-secondary">
                        {formatCentsAsCurrency(item.unitPriceCents)}
                      </TableCell>
                      <TableCell className="font-medium text-text-primary">
                        {formatCentsAsCurrency(item.unitPriceCents * item.quantity)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Summary</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3 text-sm">
            <div className="flex justify-between">
              <span className="text-text-secondary">Issued</span>
              <span className="text-text-primary">
                {invoice.issuedAt.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-text-secondary">Due</span>
              <span className="text-text-primary">
                {invoice.dueAt.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
              </span>
            </div>
            <div className="h-px bg-border" />
            <div className="flex justify-between text-base font-semibold">
              <span className="text-text-primary">Total</span>
              <span className="text-text-primary">{formatCentsAsCurrency(total)}</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
