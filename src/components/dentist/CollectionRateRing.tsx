import { formatCentsAsCurrency } from "@/lib/billing-format";

export interface CollectionRateRingProps {
  percent: number;
  /** Optional Collected/Outstanding legend rendered beside the ring, matching the Figma reference — omit for a bare ring (e.g. the Dashboard's smaller uses). */
  legend?: { collectedCents: number; outstandingCents: number };
}

export function CollectionRateRing({ percent, legend }: CollectionRateRingProps) {
  const radius = 46;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - percent / 100);

  const ring = (
    <div className="flex flex-col items-center gap-2">
      <svg width="112" height="112" viewBox="0 0 112 112" role="img" aria-label={`Collection rate: ${percent}%`}>
        <circle cx="56" cy="56" r={radius} fill="none" stroke="var(--color-surface-sunken)" strokeWidth="10" />
        <circle
          cx="56"
          cy="56"
          r={radius}
          fill="none"
          stroke="var(--color-brand-blue)"
          strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          transform="rotate(-90 56 56)"
        />
        <text x="56" y="62" textAnchor="middle" className="fill-text-primary text-[22px] font-bold">
          {percent}%
        </text>
      </svg>
      <p className="text-sm text-text-secondary">of invoices paid</p>
    </div>
  );

  if (!legend) return ring;

  return (
    <div className="flex w-full items-center justify-center gap-6">
      {ring}
      <dl className="flex flex-col gap-3 text-sm">
        <div className="flex items-center gap-2">
          <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-[var(--color-brand-blue)]" aria-hidden="true" />
          <div>
            <dt className="text-text-secondary">Collected</dt>
            <dd className="font-semibold text-text-primary">{formatCentsAsCurrency(legend.collectedCents)}</dd>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-[var(--color-brand-teal)]" aria-hidden="true" />
          <div>
            <dt className="text-text-secondary">Outstanding</dt>
            <dd className="font-semibold text-text-primary">{formatCentsAsCurrency(legend.outstandingCents)}</dd>
          </div>
        </div>
      </dl>
    </div>
  );
}
