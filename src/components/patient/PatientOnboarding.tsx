"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/cn";
import { completeOnboarding } from "@/lib/actions/complete-onboarding";

interface Slide {
  src: string;
  /** Heading is split so one phrase can carry the brand colour, as in the design. */
  before: string;
  accent: string;
  after: string;
  body: string;
}

/** Keep the length in step with `.onboarding-pos-*` in globals.css. */
const SLIDES: Slide[] = [
  {
    src: "/brand/onboarding-1.png",
    before: "Welcome to ",
    accent: "",
    after: "",
    body: "Your dental care, made simpler.",
  },
  {
    src: "/brand/onboarding-2.png",
    before: "Your next visit, right at your ",
    accent: "fingertips",
    after: ".",
    body: "Book appointments, manage your schedule, and get ready for every visit.",
  },
  {
    src: "/brand/onboarding-3.png",
    before: "Know your ",
    accent: "care.",
    after: " Every step of the way.",
    body: "Track your treatment progress, access your records, prescriptions and forms in one place.",
  },
  {
    src: "/brand/onboarding-4.png",
    before: "Everything important, right when ",
    accent: "you need it.",
    after: "",
    body: "Get reminders, connect with your care team, and stay on top of payments and insurance.",
  },
];

const TRACK_POS = ["onboarding-pos-0", "onboarding-pos-1", "onboarding-pos-2", "onboarding-pos-3"];

/** A drag shorter than this is a tap, not a page turn. */
const SWIPE_THRESHOLD_PX = 48;

export interface PatientOnboardingProps {
  /** Completes the first slide's "Welcome to ..." heading. */
  practiceName: string;
}

/**
 * First-run intro for the Patient portal — phones only (`md:hidden`), and
 * only for accounts whose `User.onboardedAt` is still null. The layout
 * decides whether to render this at all; this component owns the carousel
 * and the "mark it done" call.
 *
 * Dismissing (either "Skip" or finishing the last slide) writes the
 * timestamp through a Server Action, so the intro doesn't reappear on
 * another device the way a `localStorage` flag would. The overlay hides
 * optimistically and `router.refresh()` re-renders the layout underneath
 * with the flag set — if that write fails the user still gets into the app
 * and simply sees the intro again next time, which is the safe direction
 * to fail in.
 *
 * All four slides live in one flex track that slides horizontally; the
 * offset comes from a named class per index because the app's CSP has no
 * `unsafe-inline` for styles (same reason as `.nav-pos-*` — see
 * globals.css). Slide contents fade and rise via `isActive`-driven
 * transitions rather than keyframes, so stepping back and forth replays
 * the motion without remounting the images.
 */
export function PatientOnboarding({ practiceName }: PatientOnboardingProps) {
  const router = useRouter();
  const [index, setIndex] = useState(0);
  const [dismissed, setDismissed] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const pointerStartX = useRef<number | null>(null);

  const isLast = index === SLIDES.length - 1;

  const finish = useCallback(() => {
    setDismissed(true);
    void completeOnboarding()
      .then(() => router.refresh())
      .catch(() => {
        /* Non-fatal: the intro simply shows again next visit. */
      });
  }, [router]);

  const goTo = useCallback((next: number) => {
    setIndex(Math.min(SLIDES.length - 1, Math.max(0, next)));
  }, []);

  // Move focus into the overlay so its controls are reachable straight away
  // for keyboard and screen-reader users.
  useEffect(() => {
    containerRef.current?.focus();
  }, []);

  function handleKeyDown(event: React.KeyboardEvent<HTMLDivElement>) {
    if (event.key === "ArrowRight") {
      event.preventDefault();
      goTo(index + 1);
    } else if (event.key === "ArrowLeft") {
      event.preventDefault();
      goTo(index - 1);
    } else if (event.key === "Escape") {
      event.preventDefault();
      finish();
    }
  }

  function handlePointerDown(event: React.PointerEvent<HTMLDivElement>) {
    pointerStartX.current = event.clientX;
  }

  function handlePointerUp(event: React.PointerEvent<HTMLDivElement>) {
    const startX = pointerStartX.current;
    pointerStartX.current = null;
    if (startX == null) return;
    const delta = event.clientX - startX;
    if (Math.abs(delta) < SWIPE_THRESHOLD_PX) return;
    goTo(delta < 0 ? index + 1 : index - 1);
  }

  if (dismissed) return null;

  return (
    <div
      ref={containerRef}
      role="dialog"
      aria-modal="true"
      aria-label={"Welcome to " + practiceName}
      tabIndex={-1}
      onKeyDown={handleKeyDown}
      className="animate-fade-in fixed inset-0 z-50 flex flex-col overscroll-contain bg-background focus-visible:outline-none md:hidden"
    >
      <div className="flex justify-end p-4">
        <button
          type="button"
          onClick={finish}
          className="min-h-11 rounded-[var(--radius-md)] px-3 text-sm font-medium text-text-secondary transition-colors duration-200 ease-out hover:text-text-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-brand-blue)]"
        >
          Skip
        </button>
      </div>

      {/* Viewport for the slide track. `touch-pan-y` leaves vertical
          scrolling native while horizontal drags reach the swipe handlers. */}
      <div
        className="min-h-0 flex-1 touch-pan-y overflow-hidden"
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerUp}
        onPointerCancel={() => {
          pointerStartX.current = null;
        }}
      >
        <div className={cn("onboarding-track flex h-full", TRACK_POS[index])}>
          {SLIDES.map((slide, i) => {
            const isActive = i === index;
            return (
              <section
                key={slide.src}
                aria-hidden={!isActive}
                className="flex h-full w-full shrink-0 flex-col"
              >
                <h2
                  className={cn(
                    "px-6 text-[27px] font-bold leading-[1.2] tracking-tight text-text-primary",
                    "transition-all duration-500 ease-out motion-reduce:transition-none",
                    isActive ? "translate-y-0 opacity-100" : "translate-y-3 opacity-0",
                  )}
                >
                  {slide.before}
                  <span className="text-[var(--color-brand-blue)]">
                    {i === 0 ? practiceName : slide.accent}
                  </span>
                  {slide.after}
                </h2>
                <p
                  className={cn(
                    "mt-3 max-w-[19rem] px-6 text-sm leading-relaxed text-text-secondary",
                    "transition-all delay-75 duration-500 ease-out motion-reduce:transition-none motion-reduce:delay-0",
                    isActive ? "translate-y-0 opacity-100" : "translate-y-3 opacity-0",
                  )}
                >
                  {slide.body}
                </p>

                {/* `alt=""`: the heading beside it already says what the
                    screen is about — announcing the illustration too would
                    only repeat it. */}
                <div className="relative min-h-0 flex-1">
                  <Image
                    src={slide.src}
                    alt=""
                    width={941}
                    height={1672}
                    sizes="(max-width: 767px) 90vw, 1px"
                    priority={i === 0}
                    className={cn(
                      "onboarding-art-fade absolute inset-0 h-full w-full object-cover object-bottom",
                      "transition-all duration-700 ease-out motion-reduce:transition-none",
                      isActive
                        ? "translate-y-0 scale-100 opacity-100"
                        : "translate-y-5 scale-95 opacity-0",
                    )}
                  />
                </div>
              </section>
            );
          })}
        </div>
      </div>

      <div className="flex items-center justify-between gap-4 px-6 pb-8 pt-4">
        {index === 0 ? (
          <button
            type="button"
            onClick={() => goTo(1)}
            className="cta-gradient-slide inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-[var(--radius-2xl)] px-5 text-[15px] font-semibold text-white shadow-card transition-transform duration-200 ease-out active:scale-[0.97] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-brand-blue)] motion-reduce:active:scale-100"
          >
            Get started
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </button>
        ) : (
          <>
            <ol className="flex items-center gap-1.5" aria-label="Progress">
              {SLIDES.map((slide, i) => (
                <li
                  key={slide.src}
                  aria-current={i === index ? "step" : undefined}
                  className={cn(
                    "onboarding-dot h-1.5 rounded-full",
                    i === index ? "w-5 bg-[var(--color-brand-blue)]" : "w-1.5 bg-border-strong",
                  )}
                >
                  <span className="sr-only">
                    Step {i + 1} of {SLIDES.length}
                  </span>
                </li>
              ))}
            </ol>

            <button
              type="button"
              onClick={() => (isLast ? finish() : goTo(index + 1))}
              aria-label={isLast ? "Get started" : "Next"}
              className="cta-gradient-slide inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-white shadow-card transition-transform duration-200 ease-out hover:-translate-y-0.5 active:scale-[0.94] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-brand-blue)] motion-reduce:hover:translate-y-0 motion-reduce:active:scale-100"
            >
              <ArrowRight className="h-5 w-5" aria-hidden="true" />
            </button>
          </>
        )}
      </div>
    </div>
  );
}
