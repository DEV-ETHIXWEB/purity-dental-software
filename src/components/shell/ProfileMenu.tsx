"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ChevronDown, LogOut, UserRound } from "lucide-react";
import { Avatar } from "@/components/ui/Avatar";
import { cn } from "@/lib/cn";
import { logout } from "@/lib/actions/logout";
import type { ShellUser } from "./types";

export interface ProfileMenuProps {
  user: ShellUser;
  /** Where "View profile" navigates — this portal's Settings page. */
  profileHref: string;
}

const MENU_ITEM_CLASSES =
  "flex w-full items-center gap-2.5 rounded-[var(--radius-md)] px-3 py-2 text-left text-sm text-text-primary transition-colors duration-150 ease-out hover:bg-surface-muted focus-visible:bg-surface-muted focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[var(--color-brand-blue)]";

/**
 * Top bar avatar menu: click the picture to reach your profile or sign out.
 *
 * Deliberately a lightweight dropdown rather than the full overlay
 * treatment used by `Modal`/`MobileNavDrawer` — no portal, no focus trap,
 * no scroll lock. A menu anchored to its trigger only needs to close on
 * Escape / outside-click and hand focus back, and trapping focus in a
 * two-item menu would be more obstructive than helpful.
 */
export function ProfileMenu({ user, profileHref }: ProfileMenuProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  function close(returnFocus = false) {
    setOpen(false);
    if (returnFocus) triggerRef.current?.focus();
  }

  useEffect(() => {
    if (!open) return;

    function handlePointerDown(event: PointerEvent) {
      if (!containerRef.current?.contains(event.target as Node)) setOpen(false);
    }
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.stopPropagation();
        setOpen(false);
        triggerRef.current?.focus();
      }
    }
    // `pointerdown` rather than `click` so the menu closes on press, before
    // any underlying control activates.
    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    // Focus the first item on the next tick, once the menu has rendered.
    const timer = window.setTimeout(() => {
      menuRef.current?.querySelector<HTMLElement>('[role="menuitem"]')?.focus();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [open]);

  return (
    <div ref={containerRef} className="relative ml-1 border-l border-border pl-3">
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={`Account menu for ${user.name}`}
        className={cn(
          "flex items-center gap-2 rounded-[var(--radius-md)] p-1 transition-colors duration-200 ease-out",
          "hover:bg-surface-muted focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-brand-blue)]",
          open && "bg-surface-muted",
        )}
      >
        <Avatar name={user.name} src={user.avatarUrl} size="sm" />
        <span className="hidden text-sm font-medium text-text-primary md:inline lg:hidden">
          {user.name}
        </span>
        <ChevronDown
          className={cn(
            "h-4 w-4 shrink-0 text-text-secondary transition-transform duration-200 ease-out",
            open && "rotate-180",
          )}
          aria-hidden="true"
        />
      </button>

      {open && (
        <div
          ref={menuRef}
          role="menu"
          aria-label="Account"
          className="animate-scale-in absolute right-0 top-full z-40 mt-2 w-60 origin-top-right rounded-[var(--radius-lg)] border border-border bg-surface p-1 shadow-popover"
        >
          {/* Identity header — confirms who you're signed in as before you
              act on either item. Not a menuitem: it isn't actionable. */}
          <div className="flex items-center gap-2.5 px-3 py-2.5">
            <Avatar name={user.name} src={user.avatarUrl} size="sm" />
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-text-primary">{user.name}</p>
              {user.role && <p className="truncate text-xs text-text-secondary">{user.role}</p>}
            </div>
          </div>

          <div className="mx-1 my-1 h-px bg-border" aria-hidden="true" />

          <Link
            href={profileHref}
            role="menuitem"
            onClick={() => close()}
            className={MENU_ITEM_CLASSES}
          >
            <UserRound className="h-4 w-4 shrink-0 text-text-secondary" aria-hidden="true" />
            View profile
          </Link>

          <form action={logout}>
            <button type="submit" role="menuitem" className={MENU_ITEM_CLASSES}>
              <LogOut className="h-4 w-4 shrink-0 text-text-secondary" aria-hidden="true" />
              Log out
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
