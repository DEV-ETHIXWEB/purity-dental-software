"use client";

import { useState } from "react";
import { cn } from "@/lib/cn";
import { formatCentsAsCurrency } from "@/lib/billing-format";

export interface OutstandingByAgeChartProps {
  data: { bucket: string; amountCents: number }[];
}

const STAGGER = ["stagger-0", "stagger-1", "stagger-2", "stagger-3", "stagger-4", "stagger-5"];

/**
 * Horizontal bar breakdown of outstanding balance by age bucket. Bar width
 * is an SVG `<rect>` attribute, not CSS `style=` — see WeeklyVisitsChart's
 * header comment for why (the app's strict CSP blocks inline style
 * attributes outright once a nonce is present). The entry animation grows
 * each pill with `transform: scaleX()` rather than by animating the width
 * attribute, so it runs on the compositor instead of forcing layout.
 */
export function OutstandingByAgeChart({ data }: OutstandingByAgeChartProps) {
  const [activeBucket, setActiveBucket] = useState<string | null>(null);

  const max = Math.max(...data.map((d) => d.amountCents), 1);
  const total = data.reduce((sum, d) => sum + d.amountCents, 0);
  const width = 400;
  const height = 10;
  const cornerRadius = height / 2;

  return (
    <div className="flex flex-col gap-1">
      {data.map((d, i) => {
        // Floor tiny-but-nonzero amounts to a visible pill width so they
        // don't disappear next to a much larger bucket — but a genuinely
        // zero balance must render as zero width, not a misleading sliver.
        const barWidth = d.amountCents <= 0 ? 0 : Math.max((d.amountCents / max) * width, cornerRadius * 2);
        const active = activeBucket === d.bucket;
        const share = total > 0 ? Math.round((d.amountCents / total) * 100) : 0;
        return (
          <div
            key={d.bucket}
            className={cn(
              "-mx-2 rounded-[var(--radius-lg)] px-2 py-2 transition-colors duration-200 ease-out",
              active && "bg-surface-muted",
            )}
            onMouseEnter={() => setActiveBucket(d.bucket)}
            onMouseLeave={() => setActiveBucket(null)}
          >
            <div className="mb-1 flex items-center justify-between text-xs">
              <span className="flex items-center gap-2 font-medium text-text-primary">
                {d.bucket}
                <span
                  className={cn(
                    "text-text-secondary transition-opacity duration-200 ease-out",
                    active && d.amountCents > 0 ? "opacity-100" : "opacity-0",
                  )}
                >
                  {share}% of outstanding
                </span>
              </span>
              <span
                className={cn(
                  "tabular-nums transition-colors duration-200 ease-out",
                  active ? "font-semibold text-text-primary" : "text-text-secondary",
                )}
              >
                {formatCentsAsCurrency(d.amountCents)}
              </span>
            </div>
            <svg
              viewBox={`0 0 ${width} ${height}`}
              role="img"
              aria-label={`${d.bucket}: ${formatCentsAsCurrency(d.amountCents)}`}
              className="h-2.5 w-full"
              preserveAspectRatio="none"
            >
              <rect
                x="0"
                y="0"
                width={width}
                height={height}
                rx={cornerRadius}
                fill="var(--color-surface-sunken)"
              />
              <rect
                x="0"
                y="0"
                width={barWidth}
                height={height}
                rx={cornerRadius}
                fill="var(--color-warning)"
                className={cn(
                  "chart-bar-grow-x transition-opacity duration-200 ease-out",
                  STAGGER[i] ?? "stagger-5",
                  // Dim the other buckets rather than brightening the active
                  // one — the bar colour is already at full saturation.
                  activeBucket !== null && !active && "opacity-45",
                )}
              />
            </svg>
          </div>
        );
      })}
      <div className="mt-2 flex items-center justify-between border-t border-border pt-3 text-sm font-semibold">
        <span className="text-text-primary">Total Outstanding</span>
        <span className="tabular-nums text-text-primary">{formatCentsAsCurrency(total)}</span>
      </div>
    </div>
  );
}
