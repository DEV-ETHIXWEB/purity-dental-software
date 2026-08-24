import { type HTMLAttributes } from "react";
import { cn } from "@/lib/cn";

export type BadgeTone =
  | "neutral"
  | "success"
  | "warning"
  | "error"
  | "info"
  | "brand-blue"
  | "brand-teal";

const toneClasses: Record<BadgeTone, string> = {
  neutral: "bg-surface-sunken text-text-secondary border-border",
  success: "bg-success-bg text-success-text border-transparent",
  warning: "bg-warning-bg text-warning-text border-transparent",
  error: "bg-error-bg text-error-text border-transparent",
  info: "bg-info-bg text-info-text border-transparent",
  "brand-blue": "bg-info-bg text-[var(--color-brand-blue-text)] border-transparent",
  "brand-teal": "bg-[#e6f7f4] text-[var(--color-brand-teal-text)] border-transparent",
};

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  tone?: BadgeTone;
}

/**
 * Status/label pill. Always renders visible text — color alone never carries
 * the meaning (e.g. "Paid", "Overdue", "Penicillin allergy").
 */
export function Badge({ className, tone = "neutral", ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-[var(--radius-md)] border px-2.5 py-1 text-xs font-medium leading-none",
        toneClasses[tone],
        className,
      )}
      {...props}
    />
  );
}
