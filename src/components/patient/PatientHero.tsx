import Link from "next/link";
import Image from "next/image";
import { ChevronRight } from "lucide-react";
import { CalendarIconFilled } from "@/components/ui/icons/purity-icons";
import { formatDayCountdown } from "./formatters";

export interface PatientHeroProps {
  /** Whole days until the next booked visit, or null when nothing is on the books. */
  daysUntilNextVisit: number | null;
  /** "Tue, 25 Aug · 10:30 AM" for that visit — omitted when nothing is booked. */
  whenLabel?: string;
  /** The booked procedure, e.g. "Routine Check-up". */
  procedure?: string;
}

/** Shared by both states so the card keeps one silhouette whether or not a visit is booked. */
const CARD_CLASSES =
  "animate-pop-in stagger-3 w-full rounded-[var(--radius-xl)] border border-border bg-surface p-4 shadow-card transition-all duration-200 ease-out hover:-translate-y-0.5 hover:shadow-card-hover motion-reduce:hover:translate-y-0";

/**
 * The Patient dashboard's illustration panel — the counterpart to the
 * Dentist portal's `DashboardHero`, but deliberately still: a patient opens
 * this screen to find one thing ("when am I next seen?"), not to explore a
 * model, so there's no pointer-tracked interaction here.
 *
 * The panel takes the artwork's own 1717x916 aspect ratio rather than a
 * fixed height, so `object-contain` never has anything to crop.
 *
 * The card overlays the artwork's empty right half from `sm` up (where its
 * gradient has already faded out), but stacks underneath on phones — at
 * that width an overlay would sit right on top of the tooth.
 */
export function PatientHero({ daysUntilNextVisit, whenLabel, procedure }: PatientHeroProps) {
  return (
    <div className="decor-radial-blue-teal animate-rise-in stagger-1 overflow-hidden rounded-[var(--radius-xl)] border border-border transition-shadow duration-300 ease-out hover:shadow-card-hover">
      <div className="relative">
        {/* `alt=""`: purely decorative — the card beside it carries the
            meaning, and announcing "tooth illustration" adds nothing. */}
        <Image
          src="/brand/patient-hero.png"
          alt=""
          width={1717}
          height={916}
          sizes="(min-width: 768px) 620px, 100vw"
          priority
          className="aspect-[1717/916] w-full object-contain"
        />

        <div className="p-4 pt-0 sm:absolute sm:inset-y-0 sm:right-0 sm:flex sm:w-[56%] sm:max-w-[16rem] sm:items-center sm:justify-end sm:p-5">
          {daysUntilNextVisit == null ? (
            <div className={CARD_CLASSES}>
              <p className="text-sm font-semibold text-text-primary">No visit booked yet</p>
              <p className="mt-1 text-xs text-text-secondary">
                Booking your next check-up only takes a minute.
              </p>
              <Link
                href="/patient/appointments"
                className="cta-gradient-slide mt-3 inline-flex min-h-11 w-full items-center justify-center rounded-[var(--radius-lg)] px-3 text-sm font-medium text-white shadow-card transition-transform duration-200 ease-out active:scale-[0.97] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-brand-blue)] motion-reduce:active:scale-100"
              >
                Book a visit
              </Link>
            </div>
          ) : (
            <div className={CARD_CLASSES}>
              <div className="flex items-center gap-2">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-[var(--radius-md)] bg-surface-muted">
                  <CalendarIconFilled className="h-4 w-4" aria-hidden="true" />
                </span>
                <p className="text-xs font-medium text-text-secondary">Next appointment</p>
              </div>

              <p className="mt-2 text-xl font-bold leading-tight text-[var(--color-brand-blue-text)]">
                {formatDayCountdown(daysUntilNextVisit)}
              </p>
              {whenLabel && <p className="mt-1 text-xs text-text-secondary">{whenLabel}</p>}
              {procedure && (
                <p className="mt-0.5 text-sm font-semibold text-text-primary">{procedure}</p>
              )}

              <Link
                href="/patient/appointments"
                className="group mt-3 inline-flex min-h-11 w-full items-center justify-between gap-2 rounded-[var(--radius-lg)] border border-border px-3 text-sm font-medium text-text-primary transition-colors duration-200 ease-out hover:bg-surface-muted focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-brand-blue)]"
              >
                View details
                <ChevronRight
                  className="h-4 w-4 shrink-0 text-text-secondary transition-transform duration-200 ease-out group-hover:translate-x-0.5 motion-reduce:group-hover:translate-x-0"
                  aria-hidden="true"
                />
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
