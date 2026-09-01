import { Badge } from "@/components/ui/Badge";

export function PatientStatusBadge({ status }: { status: "Active" | "Inactive" }) {
  return <Badge tone={status === "Active" ? "success" : "neutral"}>{status}</Badge>;
}

export function RecallStatusBadge({ status }: { status: string }) {
  const tone = status.toLowerCase().includes("overdue")
    ? "error"
    : status.toLowerCase().includes("due")
      ? "warning"
      : "success";
  return <Badge tone={tone}>{status}</Badge>;
}
