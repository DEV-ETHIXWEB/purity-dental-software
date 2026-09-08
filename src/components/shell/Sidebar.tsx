"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogOut } from "lucide-react";
import { Logo } from "@/components/ui/Logo";
import { Avatar } from "@/components/ui/Avatar";
import { cn } from "@/lib/cn";
import { logout } from "@/lib/actions/logout";
import { SHELL_ICONS } from "./icon-map";
import type { ShellNavItem, ShellUser } from "./types";

export interface SidebarProps {
  navItems: ShellNavItem[];
  homeHref: string;
  user: ShellUser;
  /** Rendered inside a mobile drawer (adds a close affordance via parent) vs. the fixed desktop rail. */
  variant?: "desktop" | "drawer";
  onNavigate?: () => void;
}

const NAV_POS = ["nav-pos-0", "nav-pos-1", "nav-pos-2", "nav-pos-3", "nav-pos-4", "nav-pos-5", "nav-pos-6", "nav-pos-7"];

export function Sidebar({ navItems, homeHref, user, variant = "desktop", onNavigate }: SidebarProps) {
  const pathname = usePathname();
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const activeIndex = navItems.findIndex(
    ({ href }) => pathname === href || pathname.startsWith(`${href}/`),
  );
  // Hover wins while the pointer is in the rail; otherwise the pill rests
  // on the current page. `null` (no match, no hover) hides it entirely
  // rather than parking it on an arbitrary item.
  const pillIndex = hoveredIndex ?? (activeIndex >= 0 ? activeIndex : null);

  return (
    <nav
      aria-label="Primary"
      className={cn(
        "flex h-full flex-col gap-6 bg-surface",
        variant === "desktop" && "w-60 border-r border-border px-3 py-5",
        variant === "drawer" && "w-72 px-3 py-5",
      )}
    >
      <Link
        href={homeHref}
        onClick={onNavigate}
        className="flex items-center gap-2 px-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-brand-blue)] rounded-[var(--radius-md)]"
      >
        <Logo height={32} />
      </Link>

      <ul
        className="relative flex min-h-0 flex-1 flex-col gap-0.5 overflow-y-auto"
        onMouseLeave={() => setHoveredIndex(null)}
      >
        {/* The sliding highlight. Rendered once, behind the links (they come
            later in the DOM and are positioned, so they paint on top), and
            moved by a fixed-offset class per item — see `.nav-pill` in
            globals.css for why the offset can't be computed inline. */}
        <span
          aria-hidden="true"
          className={cn(
            "nav-pill pointer-events-none absolute inset-x-0 top-0 h-9 rounded-[var(--radius-md)] bg-surface-sunken",
            NAV_POS[pillIndex ?? 0],
            pillIndex === null ? "opacity-0" : "opacity-100",
          )}
        />
        {navItems.map(({ href, label, icon }, i) => {
          const isActive = pathname === href || pathname.startsWith(`${href}/`);
          const Icon = isActive ? SHELL_ICONS[icon].Filled : SHELL_ICONS[icon].Outline;
          return (
            <li key={href}>
              <Link
                href={href}
                onClick={onNavigate}
                onMouseEnter={() => setHoveredIndex(i)}
                aria-current={isActive ? "page" : undefined}
                className={cn(
                  "relative flex items-center gap-3 rounded-[var(--radius-md)] border-l-2 py-2 pl-2.5 pr-3 text-sm font-medium transition-colors duration-200 ease-out",
                  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-brand-blue)]",
                  isActive
                    ? "border-[var(--color-brand-blue)] text-text-primary"
                    : "border-transparent text-text-secondary hover:text-text-primary",
                )}
              >
                <Icon
                  className={cn(
                    "h-[18px] w-[18px] shrink-0 transition-colors duration-200 ease-out",
                    isActive ? "text-[var(--color-brand-blue-text)]" : "text-text-secondary",
                  )}
                  aria-hidden="true"
                />
                {label}
              </Link>
            </li>
          );
        })}
      </ul>

      <div className="flex items-center gap-2.5 rounded-[var(--radius-lg)] border border-border bg-surface-muted p-2">
        <Avatar name={user.name} src={user.avatarUrl} size="sm" />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-text-primary">{user.name}</p>
          {user.role && <p className="truncate text-xs text-text-secondary">{user.role}</p>}
        </div>
        <form action={logout}>
          <button
            type="submit"
            aria-label="Log out"
            className="rounded-[var(--radius-md)] p-1.5 text-text-secondary hover:bg-surface hover:text-text-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-brand-blue)]"
          >
            <LogOut className="h-4 w-4 shrink-0" aria-hidden="true" />
          </button>
        </form>
      </div>
    </nav>
  );
}
