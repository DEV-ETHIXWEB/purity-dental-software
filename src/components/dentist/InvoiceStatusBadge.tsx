import { Badge, type BadgeTone } from "@/components/ui/Badge";
import type { InvoiceStatus } from "@/generated/prisma/client";

const TONE: Record<InvoiceStatus, BadgeTone> = {
  PAID: "success",
  PENDING: "warning",
  OVERDUE: "error",
  DRAFT: "neutral",
  VOID: "neutral",
};

const LABEL: Record<InvoiceStatus, string> = {
  PAID: "Paid",
  PENDING: "Pending",
  OVERDUE: "Overdue",
  DRAFT: "Draft",
  VOID: "Void",
};

export function InvoiceStatusBadge({ status, className }: { status: InvoiceStatus; className?: string }) {
  return (
    <Badge tone={TONE[status]} className={className}>
      {LABEL[status]}
    </Badge>
  );
}
