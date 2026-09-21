"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import { cn } from "@/lib/cn";

/**
 * The rotating brand panel on the left of the auth split-screen.
 *
 * Three slides cycle on a timer so a visitor sees the whole product story
 * while they sign in. Each illustration is a pre-composed, transparent-
 * background render from the design team (cards and all) — the panel's job
 * is only to sit it on the blue ground and move between them.
 *
 * Motion rules:
 *  - the timer never runs under `prefers-reduced-motion`, and the
 *    transitions themselves are disabled in CSS for the same users;
 *  - rotation pauses while the pointer is over the panel or a dot has
 *    keyboard focus, so nothing moves out from under someone reading it;
 *  - only `opacity`/`transform` animate (see the `.auth-*` block in
 *    globals.css), keeping the whole thing on the compositor.
 */

interface Slide {
  src: string;
  width: number;
  height: number;
  /** Split across two lines exactly as the comps do. */
  headline: [string, string];
  /** Describes the illustration for screen readers on the active slide. */
  alt: string;
  /** Optional per-slide treatment for the artwork (see `.auth-art-*`). */
  artClassName?: string;
}

const SLIDES: Slide[] = [
  {
    src: "/brand/login-slide-1.png",
    width: 1306,
    height: 1007,
    headline: ["Smarter scheduling", "for smoother days"],
    alt: "A day's appointment schedule beside a dental chair, with an at-a-glance overview of the day's numbers.",
  },
  {
    src: "/brand/login-slide-2.png",
    width: 1259,
    height: 1021,
    headline: ["All your patient information", "in one secure place"],
    alt: "A patient record and treatment plan orbiting a tooth behind a security shield.",
  },
  {
    src: "/brand/login-slide-3.png",
    width: 1145,
    height: 853,
    headline: ["Never miss", "what matters"],
    alt: "Recall reminders and a confirmed appointment floating around a calendar and a tooth.",
    artClassName: "auth-art-fade-left",
  },
];

const ROTATE_MS = 6500;

export function AuthShowcase() {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const goTo = useCallback((next: number) => {
    setIndex(((next % SLIDES.length) + SLIDES.length) % SLIDES.length);
  }, []);

  useEffect(() => {
    if (paused) return;
    // Respect the OS "reduce motion" setting: no auto-rotation at all, the
    // dots stay as a manual control.
    const reduced =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) return;

    timerRef.current = setInterval(() => {
      setIndex((current) => (current + 1) % SLIDES.length);
    }, ROTATE_MS);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [paused]);

  return (
    <div
      className="relative hidden overflow-hidden auth-hero-bg lg:flex lg:flex-col lg:justify-between lg:p-10 xl:p-12"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={() => setPaused(false)}
    >
      <Decoration />

      <p className="relative z-10 text-xl font-bold tracking-tight text-white">Purity</p>

      <div className="relative z-10 grid flex-1 place-items-center py-4">
        {SLIDES.map((slide, i) => {
          const active = i === index;
          return (
            <div
              key={slide.src}
              className={cn(
                "auth-slide flex w-full flex-col items-center justify-center gap-6 xl:gap-7",
                active && "auth-slide-active",
              )}
              aria-hidden={!active}
            >
              <Image
                src={slide.src}
                alt={active ? slide.alt : ""}
                width={slide.width}
                height={slide.height}
                priority={i === 0}
                sizes="(min-width: 1024px) 42vw, 0px"
                className={cn(
                  "auth-slide-art h-auto max-h-[46vh] w-auto max-w-[min(34rem,92%)] object-contain",
                  slide.artClassName,
                )}
              />
              <h2 className="auth-slide-copy max-w-md text-center text-[2rem] font-bold leading-[1.2] tracking-tight text-white">
                {slide.headline[0]}
                <br />
                {slide.headline[1]}
              </h2>
            </div>
          );
        })}
      </div>

      <div className="relative z-10 flex flex-col gap-8 xl:gap-10">
        <div className="flex items-center justify-center gap-2">
          {SLIDES.map((slide, i) => (
            <button
              key={slide.src}
              type="button"
              onClick={() => goTo(i)}
              aria-label={`Show slide ${i + 1}: ${slide.headline.join(" ")}`}
              aria-current={i === index}
              className="auth-dot-btn flex h-6 items-center px-1 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
            >
              <span className={cn("auth-dot block", i === index && "auth-dot-active")} />
            </button>
          ))}
        </div>

        <p className="text-[0.65rem] font-medium uppercase leading-relaxed tracking-[0.22em] text-white/70">
          Healthier smiles
          <br />
          Brighter tomorrows
        </p>
      </div>
    </div>
  );
}

/**
 * The friendly backdrop: soft translucent circles plus a scatter of coloured
 * confetti pills, all drifting slowly. Purely decorative, so it's hidden
 * from assistive tech and never intercepts a click.
 */
function Decoration() {
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
      {/* Large translucent circles */}
      <span className="auth-drift auth-drift-slow absolute -right-24 -top-28 block h-80 w-80 rounded-full bg-white/10" />
      <span className="auth-drift auth-offset-2 absolute right-16 top-24 block h-40 w-40 rounded-full bg-white/[0.07]" />
      <span className="auth-drift auth-drift-slow auth-offset-3 absolute -bottom-28 -left-20 block h-96 w-96 rounded-full bg-white/[0.09]" />
      <span className="auth-drift auth-offset-1 absolute -left-16 top-1/3 block h-56 w-56 rounded-full border border-white/15" />
      <span className="auth-drift auth-drift-slow auth-offset-4 absolute bottom-24 right-[-3rem] block h-64 w-64 rounded-full bg-white/[0.06]" />

      {/* Confetti pills — the pop of non-blue colour in the comps. Rotation
          lives on the wrapper so the drift keyframe can own `transform`
          on the child without overwriting it. */}
      <span className="absolute left-10 top-1/4 block rotate-[25deg]">
        <span className="auth-drift auth-drift-fast block h-10 w-3 rounded-full bg-[#ffd166]" />
      </span>
      <span className="absolute right-1/4 top-16 block -rotate-[18deg]">
        <span className="auth-drift auth-offset-2 block h-11 w-3 rounded-full bg-[#5fe3a1]" />
      </span>
      <span className="absolute bottom-1/3 right-16 block rotate-[38deg]">
        <span className="auth-drift auth-drift-fast auth-offset-3 block h-10 w-3 rounded-full bg-[#a98bff]" />
      </span>
      <span className="absolute left-1/3 top-10 block rotate-[12deg]">
        <span className="auth-drift auth-offset-4 block h-7 w-2.5 rounded-full bg-white/60" />
      </span>
      <span className="absolute bottom-40 left-20 block -rotate-[30deg]">
        <span className="auth-drift auth-drift-slow auth-offset-1 block h-8 w-2.5 rounded-full bg-[#6fd6ff]" />
      </span>
    </div>
  );
}
