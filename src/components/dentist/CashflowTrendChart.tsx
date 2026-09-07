export interface CashflowTrendChartProps {
  data: { month: string; collected: number; outstanding: number }[];
}

/**
 * Hand-built SVG grouped bar chart, Collected vs. Outstanding per month —
 * same zero-dependency, CSS-variable-fill, SVG-attribute-geometry approach
 * as `WeeklyVisitsChart`/`OutstandingByAgeChart` (never inline `style=`,
 * which the app's strict CSP blocks outright once a nonce is present).
 */
export function CashflowTrendChart({ data }: CashflowTrendChartProps) {
  const max = Math.max(...data.flatMap((d) => [d.collected, d.outstanding]), 1);
  const slotWidth = 100;
  const width = slotWidth * data.length;
  const height = 180;
  const barGap = 6;
  const barWidth = (slotWidth - barGap * 3) / 2;
  const cornerRadius = 3;

  return (
    <div>
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
          return (
            <g key={d.month}>
              <rect
                x={slotX + barGap}
                y={height - collectedHeight}
                width={barWidth}
                height={collectedHeight}
                rx={cornerRadius}
                fill="var(--color-brand-blue)"
              />
              <rect
                x={slotX + barGap * 2 + barWidth}
                y={height - outstandingHeight}
                width={barWidth}
                height={outstandingHeight}
                rx={cornerRadius}
                fill="var(--color-brand-teal)"
              />
            </g>
          );
        })}
      </svg>
      <div className="mt-2 flex items-center justify-between text-xs text-text-secondary">
        {data.map((d) => (
          <span key={d.month} className="flex-1 text-center">
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
  );
}
