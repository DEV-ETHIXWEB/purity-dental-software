import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Download, Send } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { InvoiceStatusBadge } from "@/components/dentist/InvoiceStatusBadge";
import {
  TableContainer,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableHeaderCell,
  TableCell,
} from "@/components/ui/Table";
import {
  getInvoiceById,
  getPatientById,
  patientFullName,
  invoiceTotalCents,
  formatCentsAsCurrency,
  invoices,
} from "@/lib/sample-data";

export function generateStaticParams() {
  return invoices.map((i) => ({ invoiceId: i.id }));
}

export async function generateMetadata({
  params,
}: PageProps<"/hygienist/billing/invoices/[invoiceId]">): Promise<Metadata> {
  const { invoiceId } = await params;
  const invoice = getInvoiceById(invoiceId);
  return {
    title: invoice ? invoice.invoiceNumber : "Invoice not found",
    description: invoice ? `Line items and payment status for ${invoice.invoiceNumber}.` : undefined,
  };
}

export default async function HygienistInvoiceDetailPage({
  params,
}: PageProps<"/hygienist/billing/invoices/[invoiceId]">) {
  const { invoiceId } = await params;
  const invoice = getInvoiceById(invoiceId);
  if (!invoice) notFound();

  const patient = getPatientById(invoice.patientId);
  const total = invoiceTotalCents(invoice);

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
            <h1 className="text-2xl font-semibold text-text-primary">{invoice.invoiceNumber}</h1>
            <InvoiceStatusBadge status={invoice.status} />
          </div>
          <p className="text-sm text-text-secondary">
            Billed to {patient ? patientFullName(patient) : "Unknown patient"}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Send className="h-4 w-4" aria-hidden="true" />
            Send Reminder
          </Button>
          <Button size="sm">
            <Download className="h-4 w-4" aria-hidden="true" />
            Download PDF
          </Button>
        </div>
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
                {new Date(invoice.issuedAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-text-secondary">Due</span>
              <span className="text-text-primary">
                {new Date(invoice.dueAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
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
