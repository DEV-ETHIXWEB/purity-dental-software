import Image from "next/image";
import { ClockSlotIconFilled, NotificationIconFilled } from "@/components/ui/icons/purity-icons";

export interface DashboardHeroProps {
  /** Null when there's no completed-appointment data yet to compute a rate from — the chip is omitted rather than showing a misleading "0%". */
  onTimePct: number | null;
  recallsDue: number;
}

/**
 * The Dashboard's illustration panel — a real hero, not a placeholder. Uses
 * `.decor-radial-teal-blue` (globals.css — already named for exactly this:
 * "used behind hero/illustration placeholders (Dashboard hero, ...)") for
 * the background glow, same pattern as `PerioChartCard`'s gauge backdrop.
 */
export function DashboardHero({ onTimePct, recallsDue }: DashboardHeroProps) {
  return (
    <div className="decor-radial-teal-blue relative flex h-72 items-center justify-center overflow-hidden rounded-[var(--radius-xl)] border border-border p-6 sm:h-80 lg:h-[360px]">
      <Image
        src="/brand/dashboard-hero.png"
        alt=""
        width={750}
        height={750}
        sizes="400px"
        priority
        className="h-full w-auto"
      />

      {onTimePct != null && (
        <div className="absolute left-4 top-6 flex items-center gap-2 rounded-full border border-border bg-surface px-3 py-2 shadow-card">
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-info-bg text-[var(--color-brand-blue-text)]">
            <ClockSlotIconFilled className="h-4 w-4" aria-hidden="true" />
          </span>
          <div className="leading-tight">
            <p className="text-[10px] font-medium text-text-secondary">On time</p>
            <p className="text-sm font-bold text-text-primary">{onTimePct}%</p>
          </div>
        </div>
      )}

      <div className="absolute bottom-6 right-4 flex items-center gap-2 rounded-full border border-border bg-surface px-3 py-2 shadow-card">
        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-warning-bg text-warning-text">
          <NotificationIconFilled className="h-4 w-4" aria-hidden="true" />
        </span>
        <div className="leading-tight">
          <p className="text-[10px] font-medium text-text-secondary">Recalls due</p>
          <p className="text-sm font-bold text-text-primary">{recallsDue}</p>
        </div>
      </div>
    </div>
  );
}
