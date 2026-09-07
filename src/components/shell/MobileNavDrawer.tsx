"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { cn } from "@/lib/cn";
import { Sidebar } from "./Sidebar";
import type { ShellNavItem, ShellUser } from "./types";

export interface MobileNavDrawerProps {
  open: boolean;
  onClose: () => void;
  navItems: ShellNavItem[];
  homeHref: string;
  user: ShellUser;
}

const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])';

/** Must match the .animate-fade-out/.animate-slide-out-left duration in globals.css. */
const CLOSE_ANIMATION_MS = 200;

/** Slide-out navigation drawer for viewports below the `lg` breakpoint. */
export function MobileNavDrawer({ open, onClose, navItems, homeHref, user }: MobileNavDrawerProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const previouslyFocused = useRef<HTMLElement | null>(null);
  // See Modal.tsx's identical pattern for why this is adjusted during
  // render rather than in an effect body.
  const [rendered, setRendered] = useState(open);
  const [closing, setClosing] = useState(false);

  if (open && !rendered) {
    setRendered(true);
    setClosing(false);
  }
  if (!open && rendered && !closing) {
    setClosing(true);
  }

  useEffect(() => {
    if (!closing) return;
    const timer = window.setTimeout(() => {
      setRendered(false);
      setClosing(false);
    }, CLOSE_ANIMATION_MS);
    return () => window.clearTimeout(timer);
  }, [closing]);

  useEffect(() => {
    if (!open) return;

    previouslyFocused.current = document.activeElement as HTMLElement | null;
    const timer = window.setTimeout(() => {
      panelRef.current?.querySelector<HTMLElement>(FOCUSABLE_SELECTOR)?.focus();
    }, 0);
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      window.clearTimeout(timer);
      document.body.style.overflow = originalOverflow;
      previouslyFocused.current?.focus();
    };
  }, [open]);

  if (!rendered) return null;

  return createPortal(
    <div className={cn("fixed inset-0 z-50 lg:hidden", closing && "pointer-events-none")}>
      <div
        className={cn("absolute inset-0 bg-[#111827]/40", closing ? "animate-fade-out" : "animate-fade-in")}
        aria-hidden="true"
        onClick={onClose}
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label="Navigation menu"
        onKeyDown={(e) => {
          if (e.key === "Escape") onClose();
        }}
        className={cn(
          "relative z-10 flex h-full w-72 flex-col bg-surface shadow-popover",
          closing ? "animate-slide-out-left" : "animate-slide-in-left",
        )}
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Close navigation menu"
          className="absolute right-3 top-4 rounded-[var(--radius-md)] p-2 text-text-secondary hover:bg-surface-muted focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-brand-blue)]"
        >
          <X className="h-5 w-5" aria-hidden="true" />
        </button>
        <Sidebar variant="drawer" onNavigate={onClose} navItems={navItems} homeHref={homeHref} user={user} />
      </div>
    </div>,
    document.body,
  );
}
