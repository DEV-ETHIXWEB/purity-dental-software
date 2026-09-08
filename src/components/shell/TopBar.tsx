"use client";

import { useId } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Search, Menu } from "lucide-react";
import { cn } from "@/lib/cn";
import { ChatIconFilled, NotificationIcon, NotificationIconFilled } from "@/components/ui/icons/purity-icons";
import { ProfileMenu } from "./ProfileMenu";
import { SHELL_ICONS } from "./icon-map";
import type { ShellConfig } from "./types";

const PRIMARY_ACTION_CLASSES =
  "inline-flex items-center rounded-[var(--radius-lg)] font-medium transition-colors disabled:opacity-50 disabled:pointer-events-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-brand-blue)] cta-gradient-slide text-white shadow-card active:opacity-95";

export interface TopBarProps {
  onOpenMobileNav: () => void;
  user: ShellConfig["user"];
  searchPlaceholder?: string;
  primaryAction?: ShellConfig["primaryAction"];
  patientsHref: string;
  profileHref: string;
  messagesHref?: string;
  hasUnreadNotifications?: boolean;
}

export function TopBar({
  onOpenMobileNav,
  user,
  searchPlaceholder,
  primaryAction,
  patientsHref,
  profileHref,
  messagesHref,
  hasUnreadNotifications,
}: TopBarProps) {
  const router = useRouter();
  const PrimaryIcon = primaryAction ? SHELL_ICONS[primaryAction.icon].Filled : undefined;
  const NotificationBellIcon = hasUnreadNotifications ? NotificationIconFilled : NotificationIcon;
  const searchId = useId();
  const notificationsHref = messagesHref ?? patientsHref;

  function handleSearch(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const value = new FormData(e.currentTarget).get("q");
    const q = typeof value === "string" ? value.trim() : "";
    router.push(q ? `${patientsHref}?q=${encodeURIComponent(q)}` : patientsHref);
  }

  // Stays put while the page scrolls: PortalShell sizes the shell to the
  // viewport and scrolls <main> instead, so this bar sits outside the
  // scrolling region rather than needing `position: sticky` (which the root
  // layout's `overflow-x: hidden` would defeat — see PortalShell).
  return (
    <header className="flex h-16 shrink-0 items-center gap-3 border-b border-border bg-surface px-4 sm:px-6">
      <button
        type="button"
        onClick={onOpenMobileNav}
        aria-label="Open navigation menu"
        className="rounded-[var(--radius-md)] p-2 text-text-secondary hover:bg-surface-muted lg:hidden focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-brand-blue)]"
      >
        <Menu className="h-5 w-5" aria-hidden="true" />
      </button>

      <form onSubmit={handleSearch} role="search" className="relative hidden flex-1 max-w-md sm:block">
        <Search
          className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-secondary"
          aria-hidden="true"
        />
        <label htmlFor={searchId} className="sr-only">
          {searchPlaceholder ?? "Search"}
        </label>
        <input
          id={searchId}
          name="q"
          type="search"
          placeholder={searchPlaceholder ?? "Search…"}
          className="h-10 w-full rounded-[var(--radius-md)] border border-border bg-surface-muted pl-9 pr-3 text-sm text-text-primary placeholder:text-text-secondary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-brand-blue)]"
        />
      </form>

      {/* `ml-auto` is what pins this cluster to the right edge: from `sm:` up
          the search form stops growing (`max-w-md`) and this group drops its
          `flex-1`, so without an auto margin both sit bunched against the
          left with dead space to their right. */}
      <div className="ml-auto flex flex-1 items-center justify-end gap-2 sm:flex-none">
        <Link
          href={patientsHref}
          aria-label="Search patients"
          className="rounded-[var(--radius-md)] p-2 text-text-secondary hover:bg-surface-muted sm:hidden focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-brand-blue)]"
        >
          <Search className="h-5 w-5" aria-hidden="true" />
        </Link>
        {messagesHref && (
          <Link
            href={messagesHref}
            aria-label="Messages"
            className="rounded-[var(--radius-md)] p-2 text-text-secondary hover:bg-surface-muted focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-brand-blue)]"
          >
            <ChatIconFilled className="h-5 w-5" aria-hidden="true" />
          </Link>
        )}
        <Link
          href={notificationsHref}
          aria-label={hasUnreadNotifications ? "Notifications: unread items" : "Notifications"}
          className="relative rounded-[var(--radius-md)] p-2 text-text-secondary hover:bg-surface-muted focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-brand-blue)]"
        >
          <NotificationBellIcon className="h-5 w-5" aria-hidden="true" />
          {hasUnreadNotifications && (
            <span
              className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-error"
              aria-hidden="true"
            />
          )}
        </Link>

        {primaryAction && PrimaryIcon ? (
          <>
            <Link
              href={primaryAction.href}
              className={cn(PRIMARY_ACTION_CLASSES, "hidden h-8 gap-1.5 px-3 text-sm sm:inline-flex")}
            >
              <PrimaryIcon className="h-4 w-4" aria-hidden="true" />
              {primaryAction.label}
            </Link>
            <Link
              href={primaryAction.href}
              aria-label={primaryAction.label}
              className={cn(PRIMARY_ACTION_CLASSES, "h-10 w-10 justify-center p-0 sm:hidden")}
            >
              <PrimaryIcon className="h-5 w-5" aria-hidden="true" />
            </Link>
          </>
        ) : null}

        <ProfileMenu user={user} profileHref={profileHref} />
      </div>
    </header>
  );
}
