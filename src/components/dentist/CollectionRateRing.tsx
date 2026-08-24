export function CollectionRateRing({ percent }: { percent: number }) {
  const radius = 46;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - percent / 100);

  return (
    <div className="flex flex-col items-center gap-2">
      <svg width="112" height="112" viewBox="0 0 112 112" role="img" aria-label={`Collection rate: ${percent}%`}>
        <circle cx="56" cy="56" r={radius} fill="none" stroke="var(--color-surface-sunken)" strokeWidth="10" />
        <circle
          cx="56"
          cy="56"
          r={radius}
          fill="none"
          stroke="var(--color-brand-teal)"
          strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          transform="rotate(-90 56 56)"
        />
        <text x="56" y="62" textAnchor="middle" className="fill-text-primary" style={{ fontSize: "22px", fontWeight: 700 }}>
          {percent}%
        </text>
      </svg>
      <p className="text-sm text-text-secondary">Collection Rate</p>
    </div>
  );
}
