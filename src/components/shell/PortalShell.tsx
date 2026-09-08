"use client";

import { type ReactNode, useState } from "react";
import { Sidebar } from "./Sidebar";
import { TopBar } from "./TopBar";
import { MobileNavDrawer } from "./MobileNavDrawer";
import type { ShellConfig } from "./types";

export interface PortalShellProps extends ShellConfig {
  children: ReactNode;
}

/**
 * Shared, role-aware portal chrome (sidebar + top bar + mobile drawer) used
 * by every portal (Dentist, Hygienist, Receptionist, Patient). Each portal's
 * route group layout supplies its own `navItems`/`user`/`primaryAction` via
 * this `ShellConfig` — the shell itself has no role-specific logic.
 */
export function PortalShell({
  children,
  navItems,
  homeHref,
  user,
  searchPlaceholder,
  primaryAction,
  patientsHref,
  profileHref,
  messagesHref,
  hasUnreadNotifications,
}: PortalShellProps) {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  return (
    /*
     * App-shell layout: the shell itself is exactly one viewport tall and
     * clips, so the sidebar and top bar never move and only <main> scrolls.
     *
     * This is deliberate rather than `position: sticky` on each. The root
     * layout sets `overflow-x: hidden` on <html> and <body> (a horizontal-
     * scrollbar guard), and that makes <body> a scroll container which
     * itself never scrolls — so a sticky descendant resolves against a
     * scrollport that has no scroll and simply never sticks. Scrolling an
     * inner element sidesteps that entirely and keeps the guard intact.
     *
     * `h-dvh` (not `h-screen`) so mobile browser chrome collapsing doesn't
     * leave the bottom of the shell cut off.
     */
    <div className="flex h-dvh overflow-hidden">
      {/* Stretches to the shell's full height as a flex item — no `sticky`
          or `self-start` needed now that the shell is viewport-sized, and
          the profile/log-out footer stays on screen at any scroll position. */}
      <div className="hidden lg:block">
        <Sidebar variant="desktop" navItems={navItems} homeHref={homeHref} user={user} />
      </div>

      <MobileNavDrawer
        open={mobileNavOpen}
        onClose={() => setMobileNavOpen(false)}
        navItems={navItems}
        homeHref={homeHref}
        user={user}
      />

      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <TopBar
          onOpenMobileNav={() => setMobileNavOpen(true)}
          user={user}
          searchPlaceholder={searchPlaceholder}
          primaryAction={primaryAction}
          patientsHref={patientsHref}
          profileHref={profileHref}
          messagesHref={messagesHref}
          hasUnreadNotifications={hasUnreadNotifications}
        />
        {/* The only scrolling region. `min-h-0` lets it actually shrink
            inside the flex column instead of forcing the shell taller. */}
        <main className="min-h-0 flex-1 overflow-y-auto bg-background p-4 sm:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
