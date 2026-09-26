import { Badge, type BadgeTone } from "@/components/ui/Badge";
import type { PatientStatus } from "@/generated/prisma/client";

export const PATIENT_STATUS_LABEL: Record<PatientStatus, string> = {
  ACTIVE: "Active",
  COMPLETED: "Completed",
  INACTIVE: "Archived",
};

/**
 * "Archived" rather than "Inactive" in the UI: the word staff act on is
 * Remove, and what that does is archive the record — reversibly, with the
 * history intact. "Inactive" stays the stored value.
 */
const TONE: Record<PatientStatus, BadgeTone> = {
  ACTIVE: "success",
  COMPLETED: "brand-blue",
  INACTIVE: "neutral",
};

export function PatientStatusBadge({ status }: { status: PatientStatus }) {
  return <Badge tone={TONE[status]}>{PATIENT_STATUS_LABEL[status]}</Badge>;
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
