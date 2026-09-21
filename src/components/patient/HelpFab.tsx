"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LifeBuoy, X } from "lucide-react";
import { ChatIconFilled } from "@/components/ui/icons/purity-icons";
import { PhoneIcon } from "@/components/ui/icons/purity-raster-icons";
import { cn } from "@/lib/cn";

export interface HelpFabProps {
  /** Practice phone number, dialled directly from a phone. */
  phoneHref?: string;
}

const ACTION_CLASSES =
  "flex min-h-11 items-center gap-2.5 rounded-[var(--radius-lg)] border border-border bg-surface px-3.5 text-sm font-medium text-text-primary shadow-card transition-all duration-200 ease-out hover:-translate-y-0.5 hover:border-border-strong hover:shadow-card-hover focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-brand-blue)] motion-reduce:hover:translate-y-0";

/**
 * Persistent "need help" button, available on every patient screen rather
 * than only on the two pages that happen to carry a help card.
 *
 * It sits above the bottom tab bar on a phone and in the corner on desktop.
 * The same two routes the help cards offer — message the clinic, or call it —
 * so this adds reach, not a third answer to the same question.
 */
export function HelpFab({ phoneHref = "tel:+15550100200" }: HelpFabProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const pathname = usePathname();

  useEffect(() => {
    if (!open) return;
    function onPointerDown(event: PointerEvent) {
      if (!containerRef.current?.contains(event.target as Node)) setOpen(false);
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
        triggerRef.current?.focus();
      }
    }
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  // Not on Messages: the button's main action is "message the clinic", which
  // is the page you're already on, and at phone width it floats directly over
  // the composer's send button.
  if (pathname?.startsWith("/patient/messages")) return null;

  return (
    <div
      ref={containerRef}
      className={cn(
        // Clear of the bottom tab bar on a phone; a normal corner button once
        // the tab bar is gone.
        "pointer-events-none fixed inset-x-0 bottom-24 z-30 flex flex-col items-end gap-2 px-4 sm:bottom-6 sm:px-6 lg:bottom-8",
      )}
    >
      {open && (
        <div className="animate-scale-in pointer-events-auto flex origin-bottom-right flex-col items-end gap-2">
          <Link href="/patient/messages" onClick={() => setOpen(false)} className={ACTION_CLASSES}>
            <ChatIconFilled className="h-4 w-4" aria-hidden="true" />
            Message your care team
          </Link>
          <a href={phoneHref} onClick={() => setOpen(false)} className={ACTION_CLASSES}>
            <PhoneIcon className="h-4 w-4" aria-hidden="true" />
            Call the office
          </a>
        </div>
      )}

      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-label={open ? "Close help menu" : "Need help?"}
        className={cn(
          "cta-gradient-slide pointer-events-auto flex h-14 w-14 items-center justify-center rounded-full text-white shadow-popover",
          "transition-transform duration-200 ease-out hover:scale-105 active:scale-95",
          "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-brand-blue)]",
          "motion-reduce:hover:scale-100 motion-reduce:active:scale-100",
        )}
      >
        {open ? (
          <X className="h-6 w-6" aria-hidden="true" />
        ) : (
          <LifeBuoy className="h-6 w-6" aria-hidden="true" />
        )}
      </button>
    </div>
  );
}
