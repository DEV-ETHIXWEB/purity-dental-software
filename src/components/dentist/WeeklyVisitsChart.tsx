export interface WeeklyVisitsChartProps {
  data: { day: string; count: number }[];
}

/** Hand-built SVG/CSS bar chart, Mon–Sun visit counts. Zero-dependency, matches design tokens exactly. */
export function WeeklyVisitsChart({ data }: WeeklyVisitsChartProps) {
  const max = Math.max(...data.map((d) => d.count), 1);

  return (
    <div>
      <div
        role="img"
        aria-label={`Weekly visits: ${data.map((d) => `${d.day} ${d.count}`).join(", ")}`}
        className="flex h-40 items-end justify-between gap-2 sm:gap-3"
      >
        {data.map((d) => (
          <div key={d.day} className="flex flex-1 flex-col items-center gap-2">
            <div className="flex h-32 w-full items-end">
              <div
                className="brand-gradient-bg w-full rounded-t-[var(--radius-sm)] transition-all"
                style={{
                  height: `${Math.max((d.count / max) * 100, d.count > 0 ? 6 : 2)}%`,
                  opacity: d.count === 0 ? 0.25 : 1,
                }}
              />
            </div>
            <span className="text-xs font-medium text-text-secondary">{d.day}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
