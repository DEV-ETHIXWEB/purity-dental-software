"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/cn";
import { SHELL_ICONS } from "./icon-map";
import type { ShellNavItem } from "./types";

export interface BottomNavProps {
  items: ShellNavItem[];
}

/**
 * Phone/tablet tab bar. Shown below `lg`, which is exactly where the
 * desktop sidebar disappears, so there is never a width with neither.
 *
 * Rendered as a flex sibling of `<main>` rather than `position: fixed`:
 * the shell is already viewport-sized with `<main>` as the only scrolling
 * region (see PortalShell), so a normal flow item sits permanently at the
 * bottom without overlapping content, needing a z-index, or requiring
 * bottom padding on the scroll area to compensate.
 *
 * Icons come from `SHELL_ICONS` — the same outline/filled pairs the
 * sidebar uses, so a destination looks identical in both navs.
 *
 * The active tab is marked by a glowing disc behind its icon. It's a
 * per-tab element that scales up from the icon's own centre rather than a
 * single marker sliding between tabs: with five targets a slider spends
 * most of its travel over tabs the user didn't pick, which reads as the
 * selection passing through them.
 *
 * The hamburger drawer stays — it still carries the full nav (Settings
 * included) plus the account/log-out footer. This is the shortcut layer
 * over it, not a replacement.
 */
export function BottomNav({ items }: BottomNavProps) {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Primary"
      className="shrink-0 border-t border-border bg-surface pb-[env(safe-area-inset-bottom)] lg:hidden"
    >
      <ul className="flex items-stretch">
        {items.map(({ href, label, icon }) => {
          const isActive = pathname === href || pathname.startsWith(`${href}/`);
          const Icon = isActive ? SHELL_ICONS[icon].Filled : SHELL_ICONS[icon].Outline;
          return (
            <li key={href} className="flex-1">
              <Link
                href={href}
                aria-current={isActive ? "page" : undefined}
                className="group flex min-h-14 flex-col items-center justify-center gap-1 px-1 py-2 transition-transform duration-200 ease-out focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-[var(--color-brand-blue)] active:scale-[0.92] motion-reduce:active:scale-100"
              >
                <span className="relative flex h-9 w-9 items-center justify-center">
                  <span
                    aria-hidden="true"
                    className={cn(
                      "bottomnav-disc absolute inset-0 rounded-full bg-info-bg",
                      isActive ? "bottomnav-glow scale-100 opacity-100" : "scale-50 opacity-0",
                    )}
                  />
                  <Icon
                    className={cn(
                      "relative h-[22px] w-[22px] shrink-0 transition-transform duration-300 ease-out motion-reduce:transition-none",
                      isActive ? "scale-105" : "scale-100",
                    )}
                    aria-hidden="true"
                  />
                </span>
                <span
                  className={cn(
                    "text-[11px] font-medium leading-none transition-colors duration-200 ease-out",
                    isActive ? "text-[var(--color-brand-blue-text)]" : "text-text-secondary",
                  )}
                >
                  {label}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
