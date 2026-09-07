import { Badge } from "@/components/ui/Badge";
import type { PatientStatus } from "@/generated/prisma/client";

const LABEL: Record<PatientStatus, string> = { ACTIVE: "Active", INACTIVE: "Inactive" };

export function PatientStatusBadge({ status }: { status: PatientStatus }) {
  return <Badge tone={status === "ACTIVE" ? "success" : "neutral"}>{LABEL[status]}</Badge>;
}

export function RecallStatusBadge({ status }: { status: string | null }) {
  if (!status) return <Badge tone="neutral">No recall on file</Badge>;
  const tone = status.toLowerCase().includes("overdue")
    ? "error"
    : status.toLowerCase().includes("due")
      ? "warning"
      : "success";
  return <Badge tone={tone}>{status}</Badge>;
}
