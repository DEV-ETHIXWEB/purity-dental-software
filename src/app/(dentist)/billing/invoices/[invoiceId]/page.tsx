import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Download } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Avatar } from "@/components/ui/Avatar";
import { InvoiceStatusBadge } from "@/components/dentist/InvoiceStatusBadge";
import { SendInvoiceReminderButton } from "@/components/dentist/SendInvoiceReminderButton";
import { MarkInvoicePaidButton } from "@/components/dentist/MarkInvoicePaidButton";
import {
  TableContainer,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableHeaderCell,
  TableCell,
} from "@/components/ui/Table";
import { requirePageRole } from "@/lib/auth/require-portal";
import { getInvoiceById } from "@/lib/data/billing";
import { formatCentsAsCurrency, invoiceNumber } from "@/lib/billing-format";
import { patientFullName, patientAge } from "@/lib/patient-format";

export async function generateMetadata({
  params,
}: PageProps<"/billing/invoices/[invoiceId]">): Promise<Metadata> {
  const session = await requirePageRole(["DENTIST", "ADMIN"]);
  const { invoiceId } = await params;
  const invoice = await getInvoiceById(session.user.organizationId, invoiceId);
  return {
    title: invoice ? invoiceNumber(invoice) : "Invoice not found",
    description: invoice ? `Line items and payment status for ${invoiceNumber(invoice)}.` : undefined,
  };
}

export default async function InvoiceDetailPage({
  params,
}: PageProps<"/billing/invoices/[invoiceId]">) {
  const session = await requirePageRole(["DENTIST", "ADMIN"]);
  const { invoiceId } = await params;
  const invoice = await getInvoiceById(session.user.organizationId, invoiceId);
  if (!invoice) notFound();

  const subtotalCents = invoice.lineItems.reduce((sum, li) => sum + li.quantity * li.unitPriceCents, 0);
  const sexLabel = invoice.patient.sex === "MALE" ? "Male" : invoice.patient.sex === "FEMALE" ? "Female" : "Other";

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-center gap-3">
          <Avatar name={patientFullName(invoice.patient)} src={invoice.patient.photoUrl} size="lg" />
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-semibold text-text-primary">{invoiceNumber(invoice)}</h1>
              <InvoiceStatusBadge status={invoice.status} />
            </div>
            <p className="text-sm text-text-secondary">
              {patientFullName(invoice.patient)} · Age {patientAge(invoice.patient)} · {sexLabel}
            </p>
            {invoice.provider && (
              <p className="text-sm text-text-secondary">Treating Dentist: {invoice.provider.name}</p>
            )}
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {invoice.status !== "PAID" && <MarkInvoicePaidButton invoiceId={invoice.id} />}
          {invoice.status !== "PAID" && <SendInvoiceReminderButton invoice={invoice} />}
          <a
            href={`/billing/invoices/${invoice.id}/pdf`}
            className="inline-flex h-8 items-center gap-1.5 rounded-[var(--radius-lg)] border border-border bg-transparent px-3 text-sm font-medium text-text-primary transition-colors hover:bg-surface-muted focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-brand-blue)]"
          >
            <Download className="h-4 w-4" aria-hidden="true" />
            Download PDF
          </a>
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
                    <TableHeaderCell>Tooth / Quadrant</TableHeaderCell>
                    <TableHeaderCell>Qty</TableHeaderCell>
                    <TableHeaderCell>Unit Price</TableHeaderCell>
                    <TableHeaderCell>Amount</TableHeaderCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {invoice.lineItems.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="text-text-primary">{item.description}</TableCell>
                      <TableCell className="text-text-secondary">
                        {[item.tooth, item.quadrant].filter(Boolean).join(" · ") || "—"}
                      </TableCell>
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
            <div className="flex justify-between">
              <span className="text-text-secondary">Subtotal</span>
              <span className="text-text-primary">{formatCentsAsCurrency(subtotalCents)}</span>
            </div>
            {invoice.insuranceAdjustmentCents > 0 && (
              <div className="flex justify-between">
                <span className="text-text-secondary">Insurance Adjustment</span>
                <span className="text-error-text">-{formatCentsAsCurrency(invoice.insuranceAdjustmentCents)}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-text-secondary">Tax</span>
              <span className="text-text-primary">{formatCentsAsCurrency(invoice.taxCents)}</span>
            </div>
            <div className="h-px bg-border" />
            <div className="flex justify-between text-base font-semibold">
              <span className="text-text-primary">Total Due</span>
              <span className="text-text-primary">{formatCentsAsCurrency(invoice.totalCents)}</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
