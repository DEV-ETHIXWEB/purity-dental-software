import { formatCentsAsCurrency } from "@/lib/sample-data";

export interface OutstandingByAgeChartProps {
  data: { bucket: string; amountCents: number }[];
}

/** Horizontal bar breakdown of outstanding balance by age bucket. */
export function OutstandingByAgeChart({ data }: OutstandingByAgeChartProps) {
  const max = Math.max(...data.map((d) => d.amountCents), 1);

  return (
    <div className="flex flex-col gap-3">
      {data.map((d) => (
        <div key={d.bucket}>
          <div className="mb-1 flex items-center justify-between text-xs">
            <span className="font-medium text-text-primary">{d.bucket}</span>
            <span className="text-text-secondary">{formatCentsAsCurrency(d.amountCents)}</span>
          </div>
          <div className="h-2.5 w-full overflow-hidden rounded-full bg-surface-sunken">
            <div
              className="h-full rounded-full bg-[var(--color-warning)]"
              style={{ width: `${(d.amountCents / max) * 100}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
