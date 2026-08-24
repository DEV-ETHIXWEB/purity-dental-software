import type { LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/Card";
import { cn } from "@/lib/cn";

export interface BillingKpiCardProps {
  label: string;
  value: string;
  icon: LucideIcon;
  tone?: "neutral" | "success" | "warning" | "error";
}

const TONE_CLASSES: Record<NonNullable<BillingKpiCardProps["tone"]>, string> = {
  neutral: "bg-info-bg text-[var(--color-brand-blue-text)]",
  success: "bg-success-bg text-success-text",
  warning: "bg-warning-bg text-warning-text",
  error: "bg-error-bg text-error-text",
};

export function BillingKpiCard({ label, value, icon: Icon, tone = "neutral" }: BillingKpiCardProps) {
  return (
    <Card>
      <CardContent className="flex items-center gap-4">
        <div className={cn("flex h-11 w-11 shrink-0 items-center justify-center rounded-[var(--radius-lg)]", TONE_CLASSES[tone])}>
          <Icon className="h-5 w-5" aria-hidden="true" />
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm text-text-secondary">{label}</p>
          <p className="truncate text-xl font-semibold text-text-primary">{value}</p>
        </div>
      </CardContent>
    </Card>
  );
}
