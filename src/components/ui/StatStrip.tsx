import type { ComponentType } from "react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/cn";
import { IconBadge, type IconBadgeTone } from "./IconBadge";

export interface StatStripItem {
  label: string;
  value: string | number;
  icon?: LucideIcon | ComponentType<{ className?: string; "aria-hidden"?: boolean | "true" | "false" }>;
  /** Colors the value text — use sparingly, only when the number itself needs to read as good/bad. */
  tone?: "default" | "success" | "warning" | "error";
  /** variant="badge" only: background/text color of the icon circle. Defaults to "blue". */
  iconTone?: IconBadgeTone;
  /**
   * variant="badge" only: % change vs. the same metric last month, rendered
   * as "↑14% vs last month" / "↓8% vs last month". Omit (or pass null) to
   * show no delta line — don't pass a fabricated number just to fill the
   * space.
   */
  deltaPct?: number | null;
}

const TONE_TEXT: Record<NonNullable<StatStripItem["tone"]>, string> = {
  default: "text-text-primary",
  success: "text-success-text",
  warning: "text-warning-text",
  error: "text-error-text",
};

const STAGGER = ["stagger-0", "stagger-1", "stagger-2", "stagger-3", "stagger-4", "stagger-5", "stagger-6", "stagger-7"];

/** Static class lookup — Tailwind needs literal class names, not `grid-cols-${n}`. */
const SM_COLS: Record<number, string> = {
  1: "sm:grid-cols-1",
  2: "sm:grid-cols-2",
  3: "sm:grid-cols-3",
  4: "sm:grid-cols-4",
};

export interface StatStripProps {
  items: StatStripItem[];
  className?: string;
  /**
   * "inline" (default): a compact KPI row, one bordered surface divided
   * into segments — the icon, when present, is a small inline hint next to
   * the label, never a decorative chip. Used everywhere except where Figma
   * explicitly calls for icon badges (Dentist Dashboard/Billing).
   * "badge": a colored icon circle (via `IconBadge`) beside the value, plus
   * an optional "vs last month" delta line — matches the Figma stat cards.
   */
  variant?: "inline" | "badge";
}

export function StatStrip({ items, className, variant = "inline" }: StatStripProps) {
  const cols = Math.min(Math.max(items.length, 1), 4);
  return (
    <div
      className={cn(
        "grid divide-x divide-y divide-border overflow-hidden rounded-[var(--radius-xl)] border border-border bg-surface sm:divide-y-0",
        cols >= 2 ? "grid-cols-2" : "grid-cols-1",
        SM_COLS[cols],
        className,
      )}
    >
      {items.map((item, i) =>
        variant === "badge" ? (
          <div
            key={item.label}
            className={cn(
              "animate-rise-in flex items-center gap-2.5 px-4 py-4 sm:gap-3 sm:px-5",
              "transition-colors duration-200 ease-out hover:bg-surface-muted",
              STAGGER[i] ?? "stagger-7",
            )}
          >
            {item.icon && <IconBadge icon={item.icon} tone={item.iconTone ?? "blue"} />}
            <div className="flex min-w-0 flex-col gap-0.5">
              {/* Wraps rather than truncates: in the 2-up phone grid these
                  labels ("Outstanding Balance", "Collected This Month") were
                  clipping to "Outstanding…". Two lines is the ceiling, and
                  every card in the row shares a grid track height anyway. */}
              <span className="line-clamp-2 text-xs font-medium text-text-secondary">{item.label}</span>
              <p
                className={cn(
                  // Steps down below `sm` so a full currency figure
                  // ("$2,308.77") still fits the 2-up grid on a phone —
                  // at the desktop size it overflowed and clipped.
                  "text-[18px] font-semibold leading-tight tabular-nums sm:text-[22px]",
                  TONE_TEXT[item.tone ?? "default"],
                )}
              >
                {item.value}
              </p>
              {item.deltaPct != null && (
                <span className={cn("text-xs font-medium", item.deltaPct >= 0 ? "text-success-text" : "text-error-text")}>
                  {item.deltaPct >= 0 ? "↑" : "↓"}
                  {Math.abs(item.deltaPct)}% vs last month
                </span>
              )}
            </div>
          </div>
        ) : (
          <div
            key={item.label}
            className={cn(
              "animate-rise-in flex flex-col gap-1.5 px-4 py-4 sm:px-5",
              "transition-colors duration-200 ease-out hover:bg-surface-muted",
              STAGGER[i] ?? "stagger-7",
            )}
          >
            <div className="flex items-center gap-1.5 text-xs font-medium text-text-secondary">
              {item.icon && <item.icon className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />}
              <span className="line-clamp-2">{item.label}</span>
            </div>
            <p
              className={cn(
                "text-[21px] font-semibold leading-none tabular-nums sm:text-[26px]",
                TONE_TEXT[item.tone ?? "default"],
              )}
            >
              {item.value}
            </p>
          </div>
        ),
      )}
    </div>
  );
}
