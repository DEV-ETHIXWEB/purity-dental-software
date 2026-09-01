import { Sparkles } from "lucide-react";

/**
 * Dashboard hero decoration.
 *
 * The real design uses a 3D-rendered translucent blue dental-appliance
 * (mouthguard) illustration here — see
 * `purity dental software Data/Purity assets (design team).../` for
 * reference stills. We do not attempt to recreate that 3D render in code.
 * This is a clean gradient + icon placeholder sized to the same footprint;
 * swap in the final asset (as an `next/image`) from the design team when
 * it's exported.
 */
export function DashboardHero() {
  return (
    <div
      aria-hidden="true"
      className="decor-radial-teal-blue relative hidden h-full min-h-[180px] w-full items-center justify-center overflow-hidden rounded-[var(--radius-2xl)] sm:flex"
    >
      <div className="brand-gradient-bg flex h-24 w-24 items-center justify-center rounded-full opacity-90 blur-[1px]">
        <Sparkles className="h-10 w-10 text-white" />
      </div>
      <div className="absolute inset-0 rounded-[var(--radius-2xl)] border border-white/40" />
    </div>
  );
}
