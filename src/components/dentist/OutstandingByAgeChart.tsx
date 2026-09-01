import { formatCentsAsCurrency } from "@/lib/sample-data";

export interface OutstandingByAgeChartProps {
  data: { bucket: string; amountCents: number }[];
}

/**
 * Horizontal bar breakdown of outstanding balance by age bucket. Bar width
 * is an SVG `<rect>` attribute, not CSS `style=` — see WeeklyVisitsChart's
 * header comment for why (the app's strict CSP blocks inline style
 * attributes outright once a nonce is present).
 */
export function OutstandingByAgeChart({ data }: OutstandingByAgeChartProps) {
  const max = Math.max(...data.map((d) => d.amountCents), 1);
  const width = 400;
  const height = 10;
  const cornerRadius = height / 2;

  return (
    <div className="flex flex-col gap-3">
      {data.map((d) => {
        const barWidth = Math.max((d.amountCents / max) * width, cornerRadius * 2);
        return (
          <div key={d.bucket}>
            <div className="mb-1 flex items-center justify-between text-xs">
              <span className="font-medium text-text-primary">{d.bucket}</span>
              <span className="text-text-secondary">{formatCentsAsCurrency(d.amountCents)}</span>
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
              />
            </svg>
          </div>
        );
      })}
    </div>
  );
}
