"use client";

import { useState } from "react";
import { cn } from "@/lib/cn";
import { formatCentsAsCurrency } from "@/lib/billing-format";

export interface CollectionRateRingProps {
  percent: number;
  /** Optional Collected/Outstanding legend rendered beside the ring, matching the Figma reference — omit for a bare ring (e.g. the Dashboard's smaller uses). */
  legend?: { collectedCents: number; outstandingCents: number };
}

type Segment = "collected" | "outstanding";

export function CollectionRateRing({ percent, legend }: CollectionRateRingProps) {
  const [hovered, setHovered] = useState<Segment | null>(null);

  const radius = 46;
  // Keep in sync with the hardcoded start offset in `purity-ring-draw`
  // (globals.css) — that keyframe can't read this value, since handing it
  // over would mean an inline `style=` the CSP drops.
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - percent / 100);

  const ring = (
    <div className="flex flex-col items-center gap-2">
      <svg
        width="112"
        height="112"
        viewBox="0 0 112 112"
        role="img"
        aria-label={`Collection rate: ${percent}%`}
        className="overflow-visible"
      >
        {/* Track. Doubles as the "outstanding" segment: it's the visual
            remainder of the circle, so highlighting it on hover reads as
            the unpaid share without drawing a second overlapping arc. */}
        <circle
          cx="56"
          cy="56"
          r={radius}
          fill="none"
          stroke={hovered === "outstanding" ? "var(--color-brand-teal)" : "var(--color-surface-sunken)"}
          strokeWidth={hovered === "outstanding" ? 12 : 10}
          className="transition-all duration-200 ease-out"
        />
        <circle
          cx="56"
          cy="56"
          r={radius}
          fill="none"
          stroke="var(--color-brand-blue)"
          strokeWidth={hovered === "collected" ? 12 : 10}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          transform="rotate(-90 56 56)"
          className={cn(
            "chart-ring-draw transition-all duration-200 ease-out",
            hovered === "outstanding" && "opacity-40",
          )}
        />
        <text x="56" y="62" textAnchor="middle" className="fill-text-primary text-[22px] font-bold">
          {percent}%
        </text>
      </svg>
      <p className="text-sm text-text-secondary">
        {hovered === "collected" ? "collected" : hovered === "outstanding" ? "still outstanding" : "of invoices paid"}
      </p>
    </div>
  );

  if (!legend) return ring;

  const total = legend.collectedCents + legend.outstandingCents;
  const share = (cents: number) => (total > 0 ? Math.round((cents / total) * 100) : 0);

  const rows: { key: Segment; label: string; cents: number; dot: string; ring: string }[] = [
    {
      key: "collected",
      label: "Collected",
      cents: legend.collectedCents,
      dot: "bg-[var(--color-brand-blue)]",
      ring: "hover:border-[var(--color-brand-blue)]",
    },
    {
      key: "outstanding",
      label: "Outstanding",
      cents: legend.outstandingCents,
      dot: "bg-[var(--color-brand-teal)]",
      ring: "hover:border-[var(--color-brand-teal)]",
    },
  ];

  return (
    <div className="flex w-full items-center justify-center gap-6">
      {ring}
      <dl className="flex flex-col gap-2 text-sm">
        {rows.map((row) => (
          <div
            key={row.key}
            className={cn(
              "flex items-center gap-2 rounded-[var(--radius-lg)] border border-transparent px-2 py-1.5 transition-all duration-200 ease-out",
              row.ring,
              hovered === row.key ? "bg-surface-muted" : "bg-transparent",
            )}
            onMouseEnter={() => setHovered(row.key)}
            onMouseLeave={() => setHovered(null)}
          >
            <span
              className={cn(
                "h-2.5 w-2.5 shrink-0 rounded-full transition-transform duration-200 ease-out",
                row.dot,
                hovered === row.key && "scale-125",
              )}
              aria-hidden="true"
            />
            <div>
              <dt className="text-text-secondary">{row.label}</dt>
              <dd className="font-semibold text-text-primary">
                {formatCentsAsCurrency(row.cents)}
                <span
                  className={cn(
                    "ml-1.5 text-xs font-normal text-text-secondary transition-opacity duration-200 ease-out",
                    hovered === row.key ? "opacity-100" : "opacity-0",
                  )}
                >
                  {share(row.cents)}%
                </span>
              </dd>
            </div>
          </div>
        ))}
      </dl>
    </div>
  );
}
