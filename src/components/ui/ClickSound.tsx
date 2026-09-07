"use client";

import { useEffect } from "react";

const INTERACTIVE_SELECTOR =
  'button, a[href], [role="button"], [role="tab"], [role="menuitem"], input[type="submit"], input[type="button"]';

/**
 * Plays a short, synthesized UI click on every interactive-element click,
 * app-wide — a single delegated document listener rather than wiring sound
 * into every button/link individually. Synthesized via Web Audio (a ~12ms
 * sine blip with a fast exponential decay) instead of an audio file: no
 * asset to fetch, nothing for the CSP `media-src`/`connect-src` directives
 * to allow, and no license/attribution question for a sound file pulled
 * from the internet.
 */
export function ClickSound() {
  useEffect(() => {
    let ctx: AudioContext | null = null;

    function playClick() {
      // Created lazily on the first real click (a user gesture), not on
      // mount — browsers suspend/refuse AudioContext creation before one.
      if (!ctx) {
        const AudioCtx = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
        if (!AudioCtx) return;
        ctx = new AudioCtx();
      }
      if (ctx.state === "suspended") void ctx.resume();

      const now = ctx.currentTime;
      const oscillator = ctx.createOscillator();
      const gain = ctx.createGain();
      oscillator.type = "sine";
      oscillator.frequency.setValueAtTime(760, now);
      gain.gain.setValueAtTime(0.08, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.04);
      oscillator.connect(gain);
      gain.connect(ctx.destination);
      oscillator.start(now);
      oscillator.stop(now + 0.04);
    }

    function onClick(e: MouseEvent) {
      const target = e.target;
      if (!(target instanceof Element)) return;
      const control = target.closest(INTERACTIVE_SELECTOR);
      if (!control || control.hasAttribute("disabled") || control.getAttribute("aria-disabled") === "true") return;
      playClick();
    }

    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, []);

  return null;
}
