export interface CashflowTrendChartProps {
  data: { month: string; collected: number; billed: number }[];
}

/** Hand-built SVG line chart comparing billed vs. collected revenue over time. */
export function CashflowTrendChart({ data }: CashflowTrendChartProps) {
  const width = 480;
  const height = 180;
  const padding = 24;
  const max = Math.max(...data.flatMap((d) => [d.collected, d.billed]), 1);

  const toPoint = (value: number, index: number) => {
    const x = padding + (index / (data.length - 1)) * (width - padding * 2);
    const y = height - padding - (value / max) * (height - padding * 2);
    return `${x},${y}`;
  };

  const collectedPath = data.map((d, i) => toPoint(d.collected, i)).join(" ");
  const billedPath = data.map((d, i) => toPoint(d.billed, i)).join(" ");

  return (
    <div>
      <svg
        viewBox={`0 0 ${width} ${height}`}
        role="img"
        aria-label={`Cashflow trend: ${data.map((d) => `${d.month} billed $${d.billed.toLocaleString()}, collected $${d.collected.toLocaleString()}`).join("; ")}`}
        className="w-full"
        preserveAspectRatio="xMidYMid meet"
      >
        <polyline points={billedPath} fill="none" stroke="var(--color-border-strong)" strokeWidth="2" strokeDasharray="4 4" />
        <polyline points={collectedPath} fill="none" stroke="var(--color-brand-blue)" strokeWidth="2.5" />
        {data.map((d, i) => {
          const [x, y] = toPoint(d.collected, i).split(",").map(Number);
          return <circle key={d.month} cx={x} cy={y} r="3.5" fill="var(--color-brand-blue)" />;
        })}
      </svg>
      <div className="mt-2 flex items-center justify-between text-xs text-text-secondary">
        {data.map((d) => (
          <span key={d.month}>{d.month}</span>
        ))}
      </div>
      <div className="mt-3 flex items-center gap-4 text-xs text-text-secondary">
        <span className="flex items-center gap-1.5">
          <span className="h-0.5 w-4 bg-[var(--color-brand-blue)]" /> Collected
        </span>
        <span className="flex items-center gap-1.5">
          <span className="legend-swatch-dashed h-0.5 w-4" />
          Billed
        </span>
      </div>
    </div>
  );
}
