export interface TodaysVisitsRingProps {
  completed: number;
  total: number;
}

/** Hand-built SVG ring chart — zero-dependency, fully themeable via design tokens. */
export function TodaysVisitsRing({ completed, total }: TodaysVisitsRingProps) {
  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const progress = total > 0 ? completed / total : 0;
  const offset = circumference * (1 - progress);
  const percent = Math.round(progress * 100);

  return (
    <div className="flex items-center gap-5">
      <svg
        width="128"
        height="128"
        viewBox="0 0 128 128"
        role="img"
        aria-label={`${completed} of ${total} today's visits completed, ${percent} percent`}
      >
        <circle
          cx="64"
          cy="64"
          r={radius}
          fill="none"
          stroke="var(--color-surface-sunken)"
          strokeWidth="12"
        />
        <circle
          cx="64"
          cy="64"
          r={radius}
          fill="none"
          stroke="url(#visitsRingGradient)"
          strokeWidth="12"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          transform="rotate(-90 64 64)"
        />
        <defs>
          <linearGradient id="visitsRingGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="var(--color-brand-teal)" />
            <stop offset="100%" stopColor="var(--color-brand-blue)" />
          </linearGradient>
        </defs>
        <text
          x="64"
          y="60"
          textAnchor="middle"
          className="fill-text-primary"
          style={{ fontSize: "26px", fontWeight: 700 }}
        >
          {completed}
        </text>
        <text
          x="64"
          y="80"
          textAnchor="middle"
          className="fill-text-secondary"
          style={{ fontSize: "12px" }}
        >
          of {total}
        </text>
      </svg>
      <div>
        <p className="text-sm text-text-secondary">Today&apos;s Visits</p>
        <p className="text-2xl font-semibold text-text-primary">{completed} completed</p>
        <p className="text-sm text-text-secondary">{total - completed} remaining</p>
      </div>
    </div>
  );
}
