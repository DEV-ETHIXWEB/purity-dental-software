"use client";

import { useState } from "react";
import { cn } from "@/lib/cn";

export interface CashflowTrendChartProps {
  data: { month: string; collected: number; outstanding: number }[];
}

/** Chart values arrive as dollars (see `cashflowTrend` in lib/data/billing). */
function formatDollars(value: number): string {
  return value.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
}

const STAGGER = [
  "stagger-0", "stagger-1", "stagger-2", "stagger-3", "stagger-4", "stagger-5",
  "stagger-6", "stagger-7", "stagger-8", "stagger-9", "stagger-10", "stagger-11",
];

/**
 * Hand-built SVG grouped bar chart, Collected vs. Outstanding per month —
 * same zero-dependency, CSS-variable-fill, SVG-attribute-geometry approach
 * as `WeeklyVisitsChart`/`OutstandingByAgeChart` (never inline `style=`,
 * which the app's strict CSP blocks outright once a nonce is present).
 *
 * Interaction: an overlay of one flex-1 hit area per month sits on top of
 * the SVG. Hovering (or keyboard-focusing) a column raises a tooltip and
 * dims the other months. The overlay is what makes this CSP-safe — because
 * the columns are evenly sized flex children, the tooltip anchors to its
 * own column with static utility classes and never needs a computed
 * `style="left: ..."`.
 */
export function CashflowTrendChart({ data }: CashflowTrendChartProps) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  const max = Math.max(...data.flatMap((d) => [d.collected, d.outstanding]), 1);
  const slotWidth = 100;
  const width = slotWidth * data.length;
  const height = 180;
  const barGap = 6;
  const barWidth = (slotWidth - barGap * 3) / 2;
  const cornerRadius = 3;

  return (
    /*
     * Twelve months will not fit legibly across a phone: at 375px each
     * label gets ~20px, so "Jan".."Dec" collide. Rather than shrink the
     * type to unreadable or drop months, the plot keeps a usable minimum
     * width and scrolls horizontally below `sm` — the same treatment wide
     * tables get. From `sm:` up nothing changes: the min-width is lifted
     * and overflow returns to visible so the hover tooltip is never
     * clipped (setting overflow-x alone would compute overflow-y to auto
     * and cut the tooltip off).
     */
    <div className="-mx-1 overflow-x-auto px-1 sm:mx-0 sm:overflow-x-visible sm:px-0">
      <div className="min-w-[540px] sm:min-w-0">
      <div
        className="relative"
        onMouseLeave={() => setActiveIndex(null)}
      >
        <svg
          viewBox={`0 0 ${width} ${height}`}
          role="img"
          aria-label={`Cashflow trend: ${data.map((d) => `${d.month} collected $${d.collected.toLocaleString()}, outstanding $${d.outstanding.toLocaleString()}`).join("; ")}`}
          className="w-full"
          preserveAspectRatio="xMidYMid meet"
        >
          {data.map((d, i) => {
            const slotX = i * slotWidth;
            const collectedHeight = d.collected > 0 ? Math.max((d.collected / max) * height, 4) : 0;
            const outstandingHeight = d.outstanding > 0 ? Math.max((d.outstanding / max) * height, 4) : 0;
            // Only dim once something is actually hovered, so the resting
            // state is the plain full-opacity chart.
            const dimmed = activeIndex !== null && activeIndex !== i;
            const stagger = STAGGER[i] ?? "stagger-11";
            return (
              <g
                key={d.month}
                className={cn("transition-opacity duration-200 ease-out", dimmed ? "opacity-35" : "opacity-100")}
              >
                <rect
                  x={slotX + barGap}
                  y={height - collectedHeight}
                  width={barWidth}
                  height={collectedHeight}
                  rx={cornerRadius}
                  fill="var(--color-brand-blue)"
                  className={cn("chart-bar-rise", stagger)}
                />
                <rect
                  x={slotX + barGap * 2 + barWidth}
                  y={height - outstandingHeight}
                  width={barWidth}
                  height={outstandingHeight}
                  rx={cornerRadius}
                  fill="var(--color-brand-teal)"
                  className={cn("chart-bar-rise", stagger)}
                />
              </g>
            );
          })}
        </svg>

        {/* Hit areas + tooltips. aria-hidden because the <svg> above already
            carries the full series as an accessible label — exposing 12 more
            buttons would just make a screen reader read the data twice. */}
        <div className="absolute inset-0 flex" aria-hidden="true">
          {data.map((d, i) => {
            const active = activeIndex === i;
            return (
              <div
                key={d.month}
                className="group relative flex-1"
                onMouseEnter={() => setActiveIndex(i)}
              >
                {/* Crosshair guide, revealed under the hovered column. */}
                <span
                  className={cn(
                    "pointer-events-none absolute inset-y-0 left-1/2 w-px -translate-x-1/2 bg-border transition-opacity duration-200 ease-out",
                    active ? "opacity-100" : "opacity-0",
                  )}
                />
                {active ? (
                  <div
                    className={cn(
                      "animate-tooltip-in pointer-events-none absolute top-0 z-10 w-max min-w-36 rounded-[var(--radius-lg)] border border-border bg-surface p-3 shadow-lg",
                      // Sit the card beside the hovered column, never over
                      // it — a centred tooltip would hide the two bars it's
                      // describing. Flipping side at the halfway point keeps
                      // it inside the plot at both ends of the year.
                      i < data.length / 2 ? "left-full ml-2" : "right-full mr-2",
                    )}
                  >
                    <p className="text-xs font-semibold text-text-primary">{d.month}</p>
                    <dl className="mt-2 flex flex-col gap-1.5 text-xs">
                      <div className="flex items-center gap-2">
                        <span className="h-2 w-2 shrink-0 rounded-full bg-[var(--color-brand-blue)]" />
                        <dt className="text-text-secondary">Collected</dt>
                        <dd className="ml-auto font-semibold text-text-primary">{formatDollars(d.collected)}</dd>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="h-2 w-2 shrink-0 rounded-full bg-[var(--color-brand-teal)]" />
                        <dt className="text-text-secondary">Outstanding</dt>
                        <dd className="ml-auto font-semibold text-text-primary">{formatDollars(d.outstanding)}</dd>
                      </div>
                    </dl>
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>
      </div>

      <div className="mt-2 flex items-center justify-between text-xs">
        {data.map((d, i) => (
          <span
            key={d.month}
            className={cn(
              "flex-1 text-center transition-colors duration-200 ease-out",
              activeIndex === i ? "font-semibold text-text-primary" : "text-text-secondary",
            )}
          >
            {d.month}
          </span>
        ))}
      </div>
      <div className="mt-3 flex items-center gap-4 text-xs text-text-secondary">
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-[var(--color-brand-blue)]" /> Collected
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-[var(--color-brand-teal)]" /> Outstanding
        </span>
      </div>
      </div>
    </div>
  );
}
