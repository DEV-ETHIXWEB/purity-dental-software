"use client";

import { useState } from "react";
import { cn } from "@/lib/cn";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { WeeklyVisitsChart, type WeeklyVisitsChartProps } from "@/components/dentist/WeeklyVisitsChart";

export interface TodaysVisitsCardProps {
  total: number;
  newCount: number;
  returningCount: number;
  weekly: WeeklyVisitsChartProps["data"];
}

type Segment = "new" | "returning";

/**
 * Today's visit count as a two-segment ring (New vs. Returning), matching
 * the Figma Dashboard's headline card — extends `CollectionRateRing`'s
 * single-arc math to two arcs sharing one circumference, plus the existing
 * `WeeklyVisitsChart` underneath (unchanged).
 *
 * Both arcs sweep in on mount via `.chart-ring-draw`, and the legend is
 * hoverable the same way `CollectionRateRing`'s is: highlighting a row
 * thickens its arc, fades the other, and reveals that segment's share.
 */
export function TodaysVisitsCard({ total, newCount, returningCount, weekly }: TodaysVisitsCardProps) {
  const [hovered, setHovered] = useState<Segment | null>(null);

  const radius = 46;
  const circumference = 2 * Math.PI * radius;
  const newFraction = total > 0 ? newCount / total : 0;
  const newLength = circumference * newFraction;
  const returningLength = circumference - newLength;
  const returningRotation = -90 + newFraction * 360;

  const share = (value: number) => (total > 0 ? Math.round((value / total) * 100) : 0);

  const rows: { key: Segment; label: string; value: number; dot: string; ring: string }[] = [
    {
      key: "new",
      label: "New",
      value: newCount,
      dot: "bg-[var(--color-brand-blue)]",
      ring: "hover:border-[var(--color-brand-blue)]",
    },
    {
      key: "returning",
      label: "Returning",
      value: returningCount,
      dot: "bg-[var(--color-brand-teal)]",
      ring: "hover:border-[var(--color-brand-teal)]",
    },
  ];

  return (
    <Card className="animate-rise-in stagger-2 transition-shadow duration-300 ease-out hover:shadow-card-hover">
      <CardHeader>
        <CardTitle>Today&apos;s Visits</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-6">
        <div className="flex items-center justify-center gap-6">
          <svg
            width="112"
            height="112"
            viewBox="0 0 112 112"
            role="img"
            aria-label={`${total} visits today: ${newCount} new, ${returningCount} returning`}
            className="overflow-visible"
          >
            <circle cx="56" cy="56" r={radius} fill="none" stroke="var(--color-surface-sunken)" strokeWidth="10" />
            {total > 0 && (
              <>
                <circle
                  cx="56"
                  cy="56"
                  r={radius}
                  fill="none"
                  stroke="var(--color-brand-blue)"
                  strokeWidth={hovered === "new" ? 12 : 10}
                  strokeDasharray={`${newLength} ${circumference - newLength}`}
                  transform="rotate(-90 56 56)"
                  className={cn(
                    "chart-ring-draw transition-all duration-200 ease-out",
                    hovered === "returning" && "opacity-35",
                  )}
                />
                <circle
                  cx="56"
                  cy="56"
                  r={radius}
                  fill="none"
                  stroke="var(--color-brand-teal)"
                  strokeWidth={hovered === "returning" ? 12 : 10}
                  strokeDasharray={`${returningLength} ${circumference - returningLength}`}
                  transform={`rotate(${returningRotation} 56 56)`}
                  className={cn(
                    "chart-ring-draw transition-all duration-200 ease-out",
                    hovered === "new" && "opacity-35",
                  )}
                />
              </>
            )}
            <text x="56" y="62" textAnchor="middle" className="fill-text-primary text-[26px] font-bold">
              {hovered === "new" ? newCount : hovered === "returning" ? returningCount : total}
            </text>
          </svg>
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
                    {row.value}
                    <span
                      className={cn(
                        "ml-1.5 text-xs font-normal text-text-secondary transition-opacity duration-200 ease-out",
                        hovered === row.key && total > 0 ? "opacity-100" : "opacity-0",
                      )}
                    >
                      {share(row.value)}%
                    </span>
                  </dd>
                </div>
              </div>
            ))}
          </dl>
        </div>
        <WeeklyVisitsChart data={weekly} />
      </CardContent>
    </Card>
  );
}
