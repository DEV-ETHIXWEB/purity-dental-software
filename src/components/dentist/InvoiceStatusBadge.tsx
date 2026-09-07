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

export function InvoiceStatusBadge({ status }: { status: InvoiceStatus }) {
  return <Badge tone={TONE[status]}>{LABEL[status]}</Badge>;
}
