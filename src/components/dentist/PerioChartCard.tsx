import type { PerioChartEntry } from "@/generated/prisma/client";

type Tone = "success" | "warning" | "error";

const TEXT_TONE_CLASS: Record<Tone, string> = {
  success: "text-success",
  warning: "text-warning",
  error: "text-error",
};

const STROKE_TONE_VAR: Record<Tone, string> = {
  success: "var(--color-success)",
  warning: "var(--color-warning)",
  error: "var(--color-error)",
};

/**
 * Perio chart summary. A per-tooth interactive 3D probing-depth model is a
 * real future feature (needs a full periodontal charting data model, not
 * just the aggregate `PerioChartEntry` this app has today) — rather than a
 * "3D model — placeholder" stub, this renders a real gauge visualization of
 * the same two headline metrics using the app's existing hand-built SVG
 * chart language (see CollectionRateRing).
 */
export function PerioChartCard({ entry }: { entry: PerioChartEntry | null }) {
  if (!entry) {
    return <p className="text-sm text-text-secondary">No perio chart on file yet.</p>;
  }

  const bleedingTone: Tone =
    entry.bleedingPercent >= 20 ? "error" : entry.bleedingPercent >= 10 ? "warning" : "success";
  const depthTone: Tone =
    entry.avgPocketDepthMm >= 4 ? "error" : entry.avgPocketDepthMm >= 3 ? "warning" : "success";

  // Healthy pocket depth tops out around 3mm; scale the gauge 0-6mm so
  // "healthy" sits in the first half of the arc.
  const depthPercent = Math.min(100, Math.round((entry.avgPocketDepthMm / 6) * 100));

  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
      <div
        className="decor-radial-blue-teal flex min-h-[220px] flex-col items-center justify-center gap-4 rounded-[var(--radius-xl)] p-6"
      >
        <Gauge percent={depthPercent} tone={depthTone} label={`${entry.avgPocketDepthMm.toFixed(1)} mm`} />
        <p className="text-xs text-text-secondary">Average pocket depth (0–6mm scale)</p>
      </div>

      <dl className="flex flex-col justify-center gap-6">
        <div>
          <dt className="text-sm text-text-secondary">Average Pocket Depth</dt>
          <dd className={`text-3xl font-semibold ${TEXT_TONE_CLASS[depthTone]}`}>
            {entry.avgPocketDepthMm.toFixed(1)} mm
          </dd>
        </div>
        <div>
          <dt className="text-sm text-text-secondary">Bleeding on Probing</dt>
          <dd className={`text-3xl font-semibold ${TEXT_TONE_CLASS[bleedingTone]}`}>
            {entry.bleedingPercent}%
          </dd>
        </div>
        <p className="text-xs text-text-secondary">
          Last charted{" "}
          {new Date(entry.chartedAt).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
          })}
        </p>
      </dl>
    </div>
  );
}

function Gauge({ percent, tone, label }: { percent: number; tone: Tone; label: string }) {
  const radius = 44;
  const circumference = 2 * Math.PI * radius;
  // Half-circle gauge (180deg arc) — dasharray covers half the circle.
  const arcLength = circumference / 2;
  const offset = arcLength * (1 - percent / 100);

  return (
    <svg width="112" height="68" viewBox="0 0 112 68" role="img" aria-label={label}>
      <path
        d="M 6 62 A 50 50 0 0 1 106 62"
        fill="none"
        stroke="var(--color-surface)"
        strokeWidth="10"
        strokeLinecap="round"
      />
      <path
        d="M 6 62 A 50 50 0 0 1 106 62"
        fill="none"
        stroke={STROKE_TONE_VAR[tone]}
        strokeWidth="10"
        strokeLinecap="round"
        strokeDasharray={arcLength}
        strokeDashoffset={offset}
      />
      <text x="56" y="56" textAnchor="middle" className="fill-text-primary text-[18px] font-bold">
        {label}
      </text>
    </svg>
  );
}
