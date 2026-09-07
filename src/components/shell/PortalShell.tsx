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
  messagesHref,
  hasUnreadNotifications,
}: PortalShellProps) {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  return (
    <div className="flex min-h-screen">
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

      <div className="flex min-w-0 flex-1 flex-col">
        <TopBar
          onOpenMobileNav={() => setMobileNavOpen(true)}
          user={user}
          searchPlaceholder={searchPlaceholder}
          primaryAction={primaryAction}
          patientsHref={patientsHref}
          messagesHref={messagesHref}
          hasUnreadNotifications={hasUnreadNotifications}
        />
        <main className="flex-1 bg-background p-4 sm:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
