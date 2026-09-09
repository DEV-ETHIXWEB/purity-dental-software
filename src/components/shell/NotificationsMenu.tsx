"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowRight, CalendarClock, CreditCard, MessageSquare, BellRing } from "lucide-react";
import { cn } from "@/lib/cn";
import { NotificationIcon, NotificationIconFilled } from "@/components/ui/icons/purity-icons";
import type { ShellNotification } from "./types";

export interface NotificationsMenuProps {
  notifications: ShellNotification[];
  /** Where "View all notifications" goes — this portal's messages route, or its patient list. */
  viewAllHref: string;
  hasUnread?: boolean;
}

const KIND_ICON = {
  message: MessageSquare,
  recall: BellRing,
  billing: CreditCard,
  appointment: CalendarClock,
} as const;

const KIND_TONE = {
  message: "bg-info-bg text-[var(--color-brand-blue-text)]",
  recall: "bg-warning-bg text-warning-text",
  billing: "bg-error-bg text-error-text",
  appointment: "bg-success-bg text-success-text",
} as const;

type Filter = "all" | "unread";

/**
 * Top bar notification popup. Replaces a bell that was only a link to the
 * messages page, which gave no way to see *what* was waiting without
 * leaving the current screen.
 *
 * Follows `ProfileMenu`'s pattern deliberately — same toggle, Escape and
 * outside-pointer handling — so the two popups in the same bar behave
 * identically and opening one closes the other.
 *
 * Layout is responsive rather than a fixed dropdown: from `sm:` up it is a
 * panel anchored under the bell, and on a phone it becomes a near
 * full-width sheet pinned to the screen edges, because a 360px dropdown
 * anchored to an icon near the right edge would otherwise hang off-screen.
 */
export function NotificationsMenu({ notifications, viewAllHref, hasUnread }: NotificationsMenuProps) {
  const [open, setOpen] = useState(false);
  const [filter, setFilter] = useState<Filter>("all");
  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  const unreadCount = notifications.filter((n) => n.unread).length;
  const visible = filter === "unread" ? notifications.filter((n) => n.unread) : notifications;

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
    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  const BellIcon = hasUnread ? NotificationIconFilled : NotificationIcon;

  return (
    <div ref={containerRef} className="relative">
      <button
        ref={triggerRef}
        type="button"
        // Toggle, so a second click on the bell closes the panel. The
        // outside-pointer handler above deliberately ignores clicks inside
        // this container, or it would close the panel first and this
        // handler would immediately reopen it.
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-label={
          unreadCount > 0
            ? `Notifications: ${unreadCount} needing attention`
            : "Notifications"
        }
        className={cn(
          "relative rounded-[var(--radius-md)] p-2 text-text-secondary transition-colors duration-200 ease-out",
          "hover:bg-surface-muted focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-brand-blue)]",
          open && "bg-surface-muted text-text-primary",
        )}
      >
        <BellIcon className="h-5 w-5" aria-hidden="true" />
        {hasUnread && (
          <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-error" aria-hidden="true" />
        )}
      </button>

      {open && (
        <div
          ref={panelRef}
          role="dialog"
          aria-label="Notifications"
          className={cn(
            "animate-scale-in absolute z-40 mt-2 overflow-hidden rounded-[var(--radius-lg)] border border-border bg-surface shadow-popover",
            // Phone: pin to both screen edges so it can never overflow.
            "fixed inset-x-3 top-14 origin-top",
            // Tablet up: a normal panel hanging under the bell.
            "sm:absolute sm:inset-x-auto sm:right-0 sm:top-full sm:w-[22rem] sm:origin-top-right",
          )}
        >
          <div className="flex items-center justify-between gap-2 border-b border-border px-4 py-3">
            <p className="text-sm font-semibold text-text-primary">Notifications</p>
            {unreadCount > 0 && (
              <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-info-bg px-1.5 text-xs font-semibold text-[var(--color-brand-blue-text)]">
                {unreadCount}
              </span>
            )}
          </div>

          <div className="flex items-center gap-1 border-b border-border px-2 py-2">
            {(["all", "unread"] as const).map((value) => (
              <button
                key={value}
                type="button"
                onClick={() => setFilter(value)}
                aria-pressed={filter === value}
                className={cn(
                  "rounded-[var(--radius-md)] px-3 py-1.5 text-xs font-medium transition-colors duration-200 ease-out",
                  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-brand-blue)]",
                  filter === value
                    ? "bg-surface-muted text-text-primary"
                    : "text-text-secondary hover:bg-surface-muted hover:text-text-primary",
                )}
              >
                {value === "all" ? "All" : `Unread${unreadCount > 0 ? ` (${unreadCount})` : ""}`}
              </button>
            ))}
          </div>

          <div className="max-h-[min(60vh,22rem)] overflow-y-auto">
            {visible.length === 0 ? (
              <p className="px-4 py-8 text-center text-sm text-text-secondary">
                {notifications.length === 0
                  ? "You're all caught up."
                  : "Nothing unread right now."}
              </p>
            ) : (
              <ul className="divide-y divide-border">
                {visible.map((item) => {
                  const Icon = KIND_ICON[item.kind];
                  return (
                    <li key={item.id}>
                      <Link
                        href={item.href}
                        onClick={() => setOpen(false)}
                        className={cn(
                          "flex items-start gap-3 px-4 py-3 transition-colors duration-200 ease-out",
                          "hover:bg-surface-muted focus-visible:bg-surface-muted focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[var(--color-brand-blue)]",
                        )}
                      >
                        <span
                          className={cn(
                            "mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full",
                            KIND_TONE[item.kind],
                          )}
                        >
                          <Icon className="h-3.5 w-3.5" aria-hidden="true" />
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block text-sm text-text-primary">{item.title}</span>
                          <span className="mt-0.5 block text-xs text-text-secondary">{item.meta}</span>
                        </span>
                        {item.unread && (
                          <span
                            className="mt-2 h-2 w-2 shrink-0 rounded-full bg-[var(--color-brand-blue)]"
                            aria-hidden="true"
                          />
                        )}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          <Link
            href={viewAllHref}
            onClick={() => setOpen(false)}
            className="group/all flex items-center justify-center gap-1.5 border-t border-border px-4 py-3 text-sm font-medium text-[var(--color-brand-blue-text)] transition-colors duration-200 ease-out hover:bg-surface-muted focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[var(--color-brand-blue)]"
          >
            View all notifications
            <ArrowRight
              className="h-3.5 w-3.5 transition-transform duration-200 ease-out group-hover/all:translate-x-1 motion-reduce:group-hover/all:translate-x-0"
              aria-hidden="true"
            />
          </Link>
        </div>
      )}
    </div>
  );
}
