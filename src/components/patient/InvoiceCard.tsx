import type { ReactNode } from "react";
import { Receipt } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Badge, type BadgeTone } from "@/components/ui/Badge";
import type { InvoiceStatus } from "@/generated/prisma/client";
import type { InvoiceWithDetails } from "@/lib/data/billing";
import { formatCentsAsCurrency, invoiceNumber } from "@/lib/billing-format";
import { formatShortDate } from "./formatters";

const STATUS_LABEL: Record<InvoiceStatus, string> = {
  PAID: "Paid",
  PENDING: "Payment due",
  OVERDUE: "Past due",
  DRAFT: "Draft",
  VOID: "Void",
};

const STATUS_TONE: Record<InvoiceStatus, BadgeTone> = {
  PAID: "success",
  PENDING: "warning",
  OVERDUE: "error",
  DRAFT: "neutral",
  VOID: "neutral",
};

interface InvoiceCardProps {
  invoice: InvoiceWithDetails;
  action?: ReactNode;
}

/** Friendly card presentation of one invoice — used on the Patient billing page instead of a dense table. */
export function InvoiceCard({ invoice, action }: InvoiceCardProps) {
  const total = invoice.totalCents;

  return (
    <Card className="flex flex-col gap-3 p-5">
      <div className="flex min-w-0 items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-surface-sunken text-[var(--color-brand-blue-text)]">
            <Receipt className="h-5 w-5" aria-hidden="true" />
          </div>
          <div>
            <p className="text-sm font-semibold text-text-primary">{invoiceNumber(invoice)}</p>
            <p className="text-xs text-text-secondary">Issued {formatShortDate(invoice.issuedAt)}</p>
          </div>
        </div>
        <Badge tone={STATUS_TONE[invoice.status]}>{STATUS_LABEL[invoice.status]}</Badge>
      </div>

      <ul className="flex flex-col gap-1 text-sm text-text-secondary">
        {invoice.lineItems.map((li) => (
          <li key={li.id} className="flex justify-between gap-3">
            <span className="truncate">{li.description}</span>
            <span className="shrink-0 text-text-primary">{formatCentsAsCurrency(li.unitPriceCents * li.quantity)}</span>
          </li>
        ))}
      </ul>

      <div className="flex items-center justify-between gap-3 border-t border-border pt-3">
        <div>
          <p className="text-xs text-text-secondary">Total</p>
          <p className="text-base font-semibold text-text-primary">{formatCentsAsCurrency(total)}</p>
        </div>
        {action}
      </div>
    </Card>
  );
}
