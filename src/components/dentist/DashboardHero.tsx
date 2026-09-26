"use client";

import { useState } from "react";
import Image from "next/image";
import { cn } from "@/lib/cn";
import { ClockSlotIconFilled, NotificationIconFilled } from "@/components/ui/icons/purity-icons";

export interface DashboardHeroProps {
  /** Null when there's no completed-appointment data yet to compute a rate from — the chip is omitted rather than showing a misleading "0%". */
  onTimePct: number | null;
  recallsDue: number;
}

/**
 * Three renders of the same jaw model, ordered left → front → right, so the
 * index doubles as the horizontal band that selects it.
 */
const HERO_VIEWS = [
  { src: "/brand/left.png", label: "left" },
  { src: "/brand/front.png", label: "front" },
  { src: "/brand/right.png", label: "right" },
] as const;

/** The resting view, and where the model returns to when the pointer leaves. */
const CENTER_VIEW = 1;

/**
 * The Dashboard's illustration panel — a real hero, not a placeholder. Uses
 * `.decor-radial-teal-blue` (globals.css — already named for exactly this:
 * "used behind hero/illustration placeholders (Dashboard hero, ...)") for
 * the background glow, same pattern as `PerioChartCard`'s gauge backdrop.
 *
 * The model turns to follow the pointer: hovering the left third of the
 * panel shows the left-angled render, the middle third the front, the right
 * third the right-angled one. All three are stacked and cross-faded via
 * opacity rather than swapping one `src`, so switching is instant (every
 * render is already decoded) and never flashes an empty frame.
 *
 * Scoped to this panel only — the effect is bound to this element's own
 * bounding box, and nothing outside it reacts to the pointer.
 */
export function DashboardHero({ onTimePct, recallsDue }: DashboardHeroProps) {
  const [view, setView] = useState<number>(CENTER_VIEW);

  function handlePointerMove(event: React.PointerEvent<HTMLDivElement>) {
    const rect = event.currentTarget.getBoundingClientRect();
    if (rect.width === 0) return;
    // Which horizontal third of the panel the pointer is over. Clamped so a
    // pointer exactly on the right edge can't index past the last view.
    const ratio = (event.clientX - rect.left) / rect.width;
    const next = Math.min(HERO_VIEWS.length - 1, Math.max(0, Math.floor(ratio * HERO_VIEWS.length)));
    setView((current) => (current === next ? current : next));
  }

  return (
    <div
      onPointerMove={handlePointerMove}
      onPointerLeave={() => setView(CENTER_VIEW)}
      /*
       * The renders are opaque — they ship with their own pale-blue backdrop
       * and no alpha — so any panel background behind them showed as a ring
       * of a visibly different colour around the artwork. Keying the backdrop
       * out isn't an option: the model is translucent blue against pale blue,
       * and a flood fill eats straight through the teeth.
       *
       * So the artwork covers the panel edge to edge instead, and its own
       * backdrop becomes the panel's. Nothing behind it is ever visible, so
       * there is no seam to match. `decor-radial-teal-blue` stays as the
       * colour behind the fade between views.
       */
      className="decor-radial-teal-blue animate-rise-in stagger-1 relative h-72 overflow-hidden rounded-[var(--radius-xl)] border border-border transition-shadow duration-300 ease-out hover:shadow-card-hover sm:h-80 lg:h-[22.5rem]"
    >
      {/* Stacked renders. `alt=""` on all three: this is one decorative
          illustration that happens to have three angles, not three separate
          images a screen reader should announce. */}
      <div className="absolute inset-0">
        {HERO_VIEWS.map((heroView, i) => (
          <Image
            key={heroView.label}
            src={heroView.src}
            alt=""
            width={750}
            height={750}
            sizes="(min-width: 1024px) 40vw, 100vw"
            priority={i === CENTER_VIEW}
            className={cn(
              // Centred crop. The panel is roughly the render's own aspect
              // ratio at most widths, so little is lost either way; at the
              // widest column an off-centre crop started clipping the glass
              // base, and centring keeps both the base and the arch in frame.
              "absolute inset-0 h-full w-full object-cover object-center",
              "transition-opacity duration-300 ease-out motion-reduce:transition-none",
              i === view ? "opacity-100" : "opacity-0",
            )}
          />
        ))}
      </div>

      {onTimePct != null && (
        <div className="animate-pop-in stagger-3 absolute left-4 top-6 flex items-center gap-2 rounded-full border border-border bg-surface px-3 py-2 shadow-card transition-transform duration-200 ease-out hover:-translate-y-0.5 motion-reduce:hover:translate-y-0">
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-info-bg text-[var(--color-brand-blue-text)]">
            <ClockSlotIconFilled className="h-4 w-4" aria-hidden="true" />
          </span>
          <div className="leading-tight">
            <p className="text-[10px] font-medium text-text-secondary">On time</p>
            <p className="text-sm font-bold text-text-primary">{onTimePct}%</p>
          </div>
        </div>
      )}

      <div className="animate-pop-in stagger-4 absolute bottom-6 right-4 flex items-center gap-2 rounded-full border border-border bg-surface px-3 py-2 shadow-card transition-transform duration-200 ease-out hover:-translate-y-0.5 motion-reduce:hover:translate-y-0">
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
