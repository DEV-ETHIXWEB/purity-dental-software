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

const SEGMENTS: { key: Segment; label: string; dot: string; rule: string }[] = [
  {
    key: "new",
    label: "New",
    dot: "bg-[var(--color-brand-blue)]",
    rule: "bg-[var(--color-brand-blue)]",
  },
  {
    key: "returning",
    label: "Returning",
    dot: "bg-[var(--color-brand-teal)]",
    rule: "bg-[var(--color-brand-teal)]",
  },
];

/**
 * Today's visit count, split New vs. Returning, with the week's volume
 * underneath.
 *
 * This used to be a two-segment ring with the split relegated to a legend
 * beside it. The ring cost a 112px square to encode one ratio that the two
 * numbers state outright, and on the most common day — nothing booked yet —
 * it drew an empty grey circle around a zero. The two figures now sit side by
 * side at full size, which is what the card is actually for, and the
 * `WeeklyVisitsChart` below is unchanged.
 */
export function TodaysVisitsCard({ total, newCount, returningCount, weekly }: TodaysVisitsCardProps) {
  const [hovered, setHovered] = useState<Segment | null>(null);

  const valueFor = (key: Segment) => (key === "new" ? newCount : returningCount);
  const share = (value: number) => (total > 0 ? Math.round((value / total) * 100) : 0);

  return (
    <Card className="animate-rise-in stagger-2 transition-shadow duration-300 ease-out hover:shadow-card-hover">
      <CardHeader>
        <CardTitle>Today&apos;s Visits</CardTitle>
        <span className="text-sm text-text-secondary">
          <span className="font-semibold text-text-primary">{total}</span>{" "}
          {total === 1 ? "visit" : "visits"} booked
        </span>
      </CardHeader>
      <CardContent className="flex flex-col gap-6">
        <dl
          className="grid grid-cols-2 divide-x divide-border"
          aria-label={`${total} visits today: ${newCount} new, ${returningCount} returning`}
        >
          {SEGMENTS.map((segment) => {
            const value = valueFor(segment.key);
            const active = hovered === segment.key;
            return (
              <div
                key={segment.key}
                onMouseEnter={() => setHovered(segment.key)}
                onMouseLeave={() => setHovered(null)}
                className={cn(
                  "flex flex-col gap-2 px-4 py-1 transition-colors duration-200 ease-out",
                  // First cell keeps its left padding off the card edge.
                  "first:pl-0 last:pr-0",
                )}
              >
                {/* A short colour rule rather than a legend dot alone: it ties
                    each figure to its series without needing a key. */}
                <span
                  aria-hidden="true"
                  className={cn(
                    "h-1 w-8 rounded-full transition-all duration-200 ease-out",
                    segment.rule,
                    active ? "w-12 opacity-100" : "opacity-70",
                  )}
                />
                <dt className="flex items-center gap-2 text-sm text-text-secondary">
                  <span
                    aria-hidden="true"
                    className={cn(
                      "h-2 w-2 shrink-0 rounded-full transition-transform duration-200 ease-out",
                      segment.dot,
                      active && "scale-125",
                    )}
                  />
                  {segment.label}
                </dt>
                <dd className="flex items-baseline gap-2">
                  <span className="text-3xl font-bold leading-none tracking-tight text-text-primary">
                    {value}
                  </span>
                  {total > 0 && (
                    <span className="text-xs font-medium text-text-secondary">
                      {share(value)}%
                    </span>
                  )}
                </dd>
              </div>
            );
          })}
        </dl>

        <WeeklyVisitsChart data={weekly} />
      </CardContent>
    </Card>
  );
}
