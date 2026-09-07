import { formatCentsAsCurrency } from "@/lib/billing-format";

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
  const total = data.reduce((sum, d) => sum + d.amountCents, 0);
  const width = 400;
  const height = 10;
  const cornerRadius = height / 2;

  return (
    <div className="flex flex-col gap-3">
      {data.map((d) => {
        // Floor tiny-but-nonzero amounts to a visible pill width so they
        // don't disappear next to a much larger bucket — but a genuinely
        // zero balance must render as zero width, not a misleading sliver.
        const barWidth = d.amountCents <= 0 ? 0 : Math.max((d.amountCents / max) * width, cornerRadius * 2);
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
      <div className="mt-1 flex items-center justify-between border-t border-border pt-3 text-sm font-semibold">
        <span className="text-text-primary">Total Outstanding</span>
        <span className="text-text-primary">{formatCentsAsCurrency(total)}</span>
      </div>
    </div>
  );
}
