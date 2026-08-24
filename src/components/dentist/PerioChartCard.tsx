import { Box } from "lucide-react";
import type { SamplePerioChartEntry } from "@/lib/sample-data";

/**
 * Perio chart summary. The real design shows an interactive 3D tooth-model
 * illustration for per-tooth pocket-depth entry; that render/interaction is
 * out of scope here — this renders a clean placeholder in its place (sized
 * to the same card region) plus the two headline metrics, and is ready to
 * swap for the real 3D component later.
 */
export function PerioChartCard({ entry }: { entry: SamplePerioChartEntry | null }) {
  if (!entry) {
    return <p className="text-sm text-text-secondary">No perio chart on file yet.</p>;
  }

  const bleedingTone =
    entry.bleedingPercent >= 20 ? "text-error" : entry.bleedingPercent >= 10 ? "text-warning" : "text-success";
  const depthTone =
    entry.avgPocketDepthMm >= 4 ? "text-error" : entry.avgPocketDepthMm >= 3 ? "text-warning" : "text-success";

  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
      <div
        aria-hidden="true"
        className="decor-radial-blue-teal flex min-h-[220px] items-center justify-center rounded-[var(--radius-xl)]"
      >
        {/* Placeholder for the 3D tooth-model illustration used in the design
            mockups. Drop in the final interactive 3D asset here. */}
        <div className="flex flex-col items-center gap-2 text-text-secondary">
          <Box className="h-16 w-16" strokeWidth={1.25} />
          <span className="text-xs">3D tooth model — placeholder</span>
        </div>
      </div>

      <dl className="flex flex-col justify-center gap-6">
        <div>
          <dt className="text-sm text-text-secondary">Average Pocket Depth</dt>
          <dd className={`text-3xl font-semibold ${depthTone}`}>
            {entry.avgPocketDepthMm.toFixed(1)} mm
          </dd>
        </div>
        <div>
          <dt className="text-sm text-text-secondary">Bleeding on Probing</dt>
          <dd className={`text-3xl font-semibold ${bleedingTone}`}>
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
