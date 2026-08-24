"use client";

import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { Sidebar } from "./Sidebar";
import type { ShellNavItem } from "./types";

export interface MobileNavDrawerProps {
  open: boolean;
  onClose: () => void;
  navItems: ShellNavItem[];
  homeHref: string;
}

const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])';

/** Slide-out navigation drawer for viewports below the `lg` breakpoint. */
export function MobileNavDrawer({ open, onClose, navItems, homeHref }: MobileNavDrawerProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const previouslyFocused = useRef<HTMLElement | null>(null);

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

  if (!open) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 lg:hidden">
      <div className="absolute inset-0 bg-[#111827]/40" aria-hidden="true" onClick={onClose} />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label="Navigation menu"
        onKeyDown={(e) => {
          if (e.key === "Escape") onClose();
        }}
        className="relative z-10 flex h-full w-72 flex-col bg-surface shadow-popover"
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Close navigation menu"
          className="absolute right-3 top-4 rounded-[var(--radius-md)] p-2 text-text-secondary hover:bg-surface-muted focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-brand-blue)]"
        >
          <X className="h-5 w-5" aria-hidden="true" />
        </button>
        <Sidebar variant="drawer" onNavigate={onClose} navItems={navItems} homeHref={homeHref} />
      </div>
    </div>,
    document.body,
  );
}
