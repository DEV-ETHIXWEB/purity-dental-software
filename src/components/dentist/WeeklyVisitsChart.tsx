"use client";

import { useState } from "react";
import { cn } from "@/lib/cn";

export interface WeeklyVisitsChartProps {
  data: { day: string; count: number }[];
}

const STAGGER = ["stagger-0", "stagger-1", "stagger-2", "stagger-3", "stagger-4", "stagger-5", "stagger-6", "stagger-7"];

/**
 * Hand-built SVG bar chart, Mon-Sun visit counts. Zero-dependency, matches
 * design tokens exactly. Bar geometry is driven entirely by SVG attributes
 * (x/y/width/height/opacity), not CSS `style=`, so it renders correctly
 * under the app's strict nonce-based CSP (style-src has no attribute-level
 * nonce, only <style>/<link> — an inline `style` on an HTML element is
 * blocked outright once a nonce is present, silently collapsing any
 * data-driven size to 0).
 *
 * Interaction mirrors `CashflowTrendChart`: an overlay of equal-width hit
 * areas sits over the plot, so the hovered day's tooltip anchors to its own
 * flex column with static classes and never needs a computed offset.
 */
export function WeeklyVisitsChart({ data }: WeeklyVisitsChartProps) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  const max = Math.max(...data.map((d) => d.count), 1);

  const width = 100 * data.length;
  const height = 100;
  const barGapRatio = 0.28;
  const barWidth = 100 * (1 - barGapRatio);
  const cornerRadius = 6;

  return (
    <div>
      <div className="relative" onMouseLeave={() => setActiveIndex(null)}>
        <svg
          viewBox={`0 0 ${width} ${height}`}
          role="img"
          aria-label={`Weekly visits: ${data.map((d) => `${d.day} ${d.count}`).join(", ")}`}
          className="h-40 w-full"
          preserveAspectRatio="none"
        >
          {data.map((d, i) => {
            const barHeightPct = Math.max((d.count / max) * 100, d.count > 0 ? 6 : 2);
            const barHeight = (barHeightPct / 100) * height;
            const x = i * 100 + (100 - barWidth) / 2;
            const y = height - barHeight;
            // Empty days already sit at 0.25 opacity; dim the rest only
            // relative to whatever is hovered, so the resting chart is
            // exactly as it was.
            const dimmed = activeIndex !== null && activeIndex !== i;
            return (
              <rect
                key={d.day}
                x={x}
                y={y}
                width={barWidth}
                height={Math.max(barHeight, cornerRadius)}
                rx={cornerRadius}
                fill="url(#weeklyVisitsBarGradient)"
                opacity={d.count === 0 ? 0.25 : dimmed ? 0.4 : 1}
                className={cn("chart-bar-rise transition-opacity duration-200 ease-out", STAGGER[i] ?? "stagger-7")}
              />
            );
          })}
          <defs>
            <linearGradient id="weeklyVisitsBarGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="var(--color-brand-teal)" />
              <stop offset="100%" stopColor="var(--color-brand-blue)" />
            </linearGradient>
          </defs>
        </svg>

        {/* Hit areas. aria-hidden because the <svg> above already carries the
            whole series as its accessible label. */}
        <div className="absolute inset-0 flex" aria-hidden="true">
          {data.map((d, i) => {
            const active = activeIndex === i;
            return (
              <div key={d.day} className="relative flex-1" onMouseEnter={() => setActiveIndex(i)}>
                {active ? (
                  <div
                    className={cn(
                      "animate-tooltip-in pointer-events-none absolute top-0 z-10 w-max rounded-[var(--radius-md)] border border-border bg-surface px-2.5 py-1.5 shadow-lg",
                      // Sit beside the hovered column so the bar it describes
                      // stays visible; flip side at the halfway point to stay
                      // inside the plot.
                      i < data.length / 2 ? "left-full ml-1.5" : "right-full mr-1.5",
                    )}
                  >
                    <p className="text-xs font-semibold text-text-primary">{d.day}</p>
                    <p className="text-xs text-text-secondary">
                      {d.count} {d.count === 1 ? "visit" : "visits"}
                    </p>
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>
      </div>

      <div className="mt-2 flex items-center justify-between gap-2 sm:gap-3">
        {data.map((d, i) => (
          <span
            key={d.day}
            className={cn(
              "flex-1 text-center text-xs font-medium transition-colors duration-200 ease-out",
              activeIndex === i ? "text-text-primary" : "text-text-secondary",
            )}
          >
            {d.day}
          </span>
        ))}
      </div>
    </div>
  );
}
