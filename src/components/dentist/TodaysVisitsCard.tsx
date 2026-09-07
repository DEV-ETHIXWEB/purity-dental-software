import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { WeeklyVisitsChart, type WeeklyVisitsChartProps } from "@/components/dentist/WeeklyVisitsChart";

export interface TodaysVisitsCardProps {
  total: number;
  newCount: number;
  returningCount: number;
  weekly: WeeklyVisitsChartProps["data"];
}

/**
 * Today's visit count as a two-segment ring (New vs. Returning), matching
 * the Figma Dashboard's headline card — extends `CollectionRateRing`'s
 * single-arc math to two arcs sharing one circumference, plus the existing
 * `WeeklyVisitsChart` underneath (unchanged).
 */
export function TodaysVisitsCard({ total, newCount, returningCount, weekly }: TodaysVisitsCardProps) {
  const radius = 46;
  const circumference = 2 * Math.PI * radius;
  const newFraction = total > 0 ? newCount / total : 0;
  const newLength = circumference * newFraction;
  const returningLength = circumference - newLength;
  const returningRotation = -90 + newFraction * 360;

  return (
    <Card>
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
                  strokeWidth="10"
                  strokeDasharray={`${newLength} ${circumference - newLength}`}
                  transform="rotate(-90 56 56)"
                />
                <circle
                  cx="56"
                  cy="56"
                  r={radius}
                  fill="none"
                  stroke="var(--color-brand-teal)"
                  strokeWidth="10"
                  strokeDasharray={`${returningLength} ${circumference - returningLength}`}
                  transform={`rotate(${returningRotation} 56 56)`}
                />
              </>
            )}
            <text x="56" y="62" textAnchor="middle" className="fill-text-primary text-[26px] font-bold">
              {total}
            </text>
          </svg>
          <dl className="flex flex-col gap-3 text-sm">
            <div className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-[var(--color-brand-blue)]" aria-hidden="true" />
              <div>
                <dt className="text-text-secondary">New</dt>
                <dd className="font-semibold text-text-primary">{newCount}</dd>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-[var(--color-brand-teal)]" aria-hidden="true" />
              <div>
                <dt className="text-text-secondary">Returning</dt>
                <dd className="font-semibold text-text-primary">{returningCount}</dd>
              </div>
            </div>
          </dl>
        </div>
        <WeeklyVisitsChart data={weekly} />
      </CardContent>
    </Card>
  );
}
