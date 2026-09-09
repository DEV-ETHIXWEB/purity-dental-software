"use client";

import { useEffect, useId, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Search, Menu, X } from "lucide-react";
import { cn } from "@/lib/cn";
import { NotificationsMenu } from "./NotificationsMenu";
import { ProfileMenu } from "./ProfileMenu";
import { SHELL_ICONS } from "./icon-map";
import type { ShellConfig } from "./types";

const PRIMARY_ACTION_CLASSES =
  "inline-flex items-center rounded-[var(--radius-lg)] font-medium transition-colors disabled:opacity-50 disabled:pointer-events-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-brand-blue)] cta-gradient-slide text-white shadow-card active:opacity-95";

export interface TopBarProps {
  onOpenMobileNav: () => void;
  /**
   * Whether this portal still needs the hamburger to reach its nav on small
   * screens. False for portals with a bottom tab bar, which covers the same
   * destinations - that slot shows a Settings shortcut instead (the one nav
   * item the tab bar has no room for).
   */
  showMobileNavButton?: boolean;
  /** Whether to render the global search. See `ShellConfig.showSearch`. */
  showSearch?: boolean;
  /** Portal home — where the Settings shortcut returns to when there's no earlier in-portal page to close back to. */
  homeHref: string;
  user: ShellConfig["user"];
  searchPlaceholder?: string;
  primaryAction?: ShellConfig["primaryAction"];
  patientsHref: string;
  profileHref: string;
  messagesHref?: string;
  hasUnreadNotifications?: boolean;
  notifications?: ShellConfig["notifications"];
}

export function TopBar({
  onOpenMobileNav,
  showMobileNavButton = true,
  showSearch = true,
  homeHref,
  user,
  searchPlaceholder,
  primaryAction,
  patientsHref,
  profileHref,
  messagesHref,
  hasUnreadNotifications,
  notifications = [],
}: TopBarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const PrimaryIcon = primaryAction ? SHELL_ICONS[primaryAction.icon].Filled : undefined;
  const searchId = useId();
  const notificationsHref = messagesHref ?? patientsHref;
  const onSettings = pathname === profileHref || pathname.startsWith(`${profileHref}/`);
  const SettingsIcon = onSettings ? SHELL_ICONS.settings.Filled : SHELL_ICONS.settings.Outline;
  const [searchOpen, setSearchOpen] = useState(false);
  // Where the Settings shortcut returns to. Updated on every non-Settings
  // route so pressing the gear a second time closes back to whatever the
  // user was actually looking at, not just the dashboard. Falls back to
  // home when Settings was opened cold (deep link, refresh) and there is
  // no in-portal page behind it.
  // Where the Settings shortcut returns to, so pressing the gear a second
  // time closes back to whatever the user was actually looking at rather
  // than always dumping them on the dashboard. Adjusted during render
  // rather than in an effect (see MobileNavDrawer/Modal for the same
  // pattern) — an effect would set state on every navigation, one render
  // late, and the href would lag a frame behind the route.
  const [visited, setVisited] = useState(() => ({
    seen: pathname,
    lastNonSettings: onSettings ? homeHref : pathname,
  }));
  if (visited.seen !== pathname) {
    setVisited({
      seen: pathname,
      lastNonSettings: onSettings ? visited.lastNonSettings : pathname,
    });
  }
  const mobileSearchRef = useRef<HTMLInputElement>(null);
  const searchPanelId = `${searchId}-mobile-panel`;

  // Focus the field once the panel has expanded, so opening it puts the
  // caret where the user is already looking.
  useEffect(() => {
    if (!searchOpen) return;
    const timer = window.setTimeout(() => mobileSearchRef.current?.focus(), 0);
    return () => window.clearTimeout(timer);
  }, [searchOpen]);

  function handleSearch(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const value = new FormData(e.currentTarget).get("q");
    const q = typeof value === "string" ? value.trim() : "";
    router.push(q ? `${patientsHref}?q=${encodeURIComponent(q)}` : patientsHref);
    setSearchOpen(false);
  }

  // Stays put while the page scrolls: PortalShell sizes the shell to the
  // viewport and scrolls <main> instead, so this bar sits outside the
  // scrolling region rather than needing `position: sticky` (which the root
  // layout's `overflow-x: hidden` would defeat — see PortalShell).
  return (
    <header className="shrink-0 border-b border-border bg-surface">
      <div className="flex h-16 items-center gap-3 px-4 sm:px-6">
        {showMobileNavButton ? (
          <button
            type="button"
            onClick={onOpenMobileNav}
            aria-label="Open navigation menu"
            className="rounded-[var(--radius-md)] p-2 text-text-secondary transition-colors duration-200 ease-out hover:bg-surface-muted lg:hidden focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-brand-blue)]"
          >
            <Menu className="h-5 w-5" aria-hidden="true" />
          </button>
        ) : (
          <Link
            href={onSettings ? visited.lastNonSettings : profileHref}
            aria-label={onSettings ? "Close settings" : "Settings"}
            aria-expanded={onSettings}
            className="rounded-[var(--radius-md)] p-2 transition-colors duration-200 ease-out hover:bg-surface-muted lg:hidden focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-brand-blue)]"
          >
            <SettingsIcon className="h-5 w-5" aria-hidden="true" />
          </Link>
        )}

        {showSearch && (
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
        )}

        {/* `ml-auto` is what pins this cluster to the right edge: from `sm:` up
            the search form stops growing (`max-w-md`) and this group drops its
            `flex-1`, so without an auto margin both sit bunched against the
            left with dead space to their right. */}
        <div className="ml-auto flex flex-1 items-center justify-end gap-2 sm:flex-none">
          {/* A toggle rather than a link: below `sm` the search field is
              collapsed, so this opens it in place - and pressing it again
              closes it, instead of navigating away mid-search. */}
          {showSearch && (
            <button
              type="button"
              onClick={() => setSearchOpen((open) => !open)}
              aria-label={searchOpen ? "Close search" : "Search"}
              aria-expanded={searchOpen}
              aria-controls={searchPanelId}
              className={cn(
                "rounded-[var(--radius-md)] p-2 transition-colors duration-200 ease-out hover:bg-surface-muted sm:hidden focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-brand-blue)]",
                searchOpen ? "bg-surface-muted text-text-primary" : "text-text-secondary",
              )}
            >
              {searchOpen ? (
                <X className="h-5 w-5" aria-hidden="true" />
              ) : (
                <Search className="h-5 w-5" aria-hidden="true" />
              )}
            </button>
          )}

          <NotificationsMenu
            notifications={notifications}
            viewAllHref={notificationsHref}
            hasUnread={hasUnreadNotifications}
          />

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
      </div>

      {/* Expanding search panel - phones only; from `sm` up the field is
          already inline in the row above.

          The open/close animation is the `grid-rows-[0fr]` -> `[1fr]` trick
          rather than an animated `max-height`: it resolves to the content's
          real height, so there is no magic pixel cap to outgrow, and it
          needs no inline style (which this app's CSP would drop). */}
      {showSearch && (
        <div
          id={searchPanelId}
          className={cn(
            "grid overflow-hidden transition-all duration-300 ease-out sm:hidden motion-reduce:transition-none",
            searchOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0",
          )}
        >
          <div className="min-h-0 overflow-hidden">
            <form onSubmit={handleSearch} role="search" className="relative px-4 pb-3">
              <Search
                className="pointer-events-none absolute left-7 top-1/2 h-4 w-4 -translate-y-1/2 text-text-secondary"
                aria-hidden="true"
              />
              <label htmlFor={`${searchId}-mobile`} className="sr-only">
                {searchPlaceholder ?? "Search"}
              </label>
              <input
                ref={mobileSearchRef}
                id={`${searchId}-mobile`}
                name="q"
                type="search"
                // Untabbable while collapsed: the panel is only visually
                // hidden (zero-height), so without this the field stays in
                // the tab order behind a closed panel.
                tabIndex={searchOpen ? undefined : -1}
                onKeyDown={(e) => {
                  if (e.key === "Escape") setSearchOpen(false);
                }}
                placeholder={searchPlaceholder ?? "Search…"}
                className="h-11 w-full rounded-[var(--radius-md)] border border-border bg-surface-muted pl-9 pr-3 text-sm text-text-primary placeholder:text-text-secondary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-brand-blue)]"
              />
            </form>
          </div>
        </div>
      )}
    </header>
  );
}
