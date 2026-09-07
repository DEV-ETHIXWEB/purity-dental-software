import type { ComponentType } from "react";
import { cn } from "@/lib/cn";

export type IconBadgeTone = "blue" | "teal" | "warning" | "error";

const TONE_CLASSES: Record<IconBadgeTone, string> = {
  blue: "bg-info-bg text-[var(--color-brand-blue-text)]",
  teal: "bg-[#e6f7f4] text-[var(--color-brand-teal-text)]",
  warning: "bg-warning-bg text-warning-text",
  error: "bg-error-bg text-error-text",
};

export interface IconBadgeProps {
  icon: ComponentType<{ className?: string; "aria-hidden"?: boolean | "true" | "false" }>;
  tone?: IconBadgeTone;
  className?: string;
}

/**
 * Colored-circle-with-icon, e.g. the stat-card icon in Figma's Billing
 * overview. This exact `rounded-full` + centered-icon markup was previously
 * copy-pasted inline across half a dozen files (billing/page.tsx,
 * RecallAlertModal, SwitchDentistModal, PayBalanceModal, InvoiceCard,
 * ConsentFormCard, EmptyState) — pulled out here once a second real use
 * (StatStrip's "badge" variant) needed the same markup with per-status
 * tone variety those inline copies never had.
 */
export function IconBadge({ icon: Icon, tone = "blue", className }: IconBadgeProps) {
  return (
    <span
      className={cn(
        "flex h-10 w-10 shrink-0 items-center justify-center rounded-full",
        TONE_CLASSES[tone],
        className,
      )}
    >
      <Icon className="h-5 w-5" aria-hidden="true" />
    </span>
  );
}
