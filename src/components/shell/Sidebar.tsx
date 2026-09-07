"use client";

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

export function Sidebar({ navItems, homeHref, user, variant = "desktop", onNavigate }: SidebarProps) {
  const pathname = usePathname();

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

      <ul className="flex flex-1 flex-col gap-0.5">
        {navItems.map(({ href, label, icon }) => {
          const isActive = pathname === href || pathname.startsWith(`${href}/`);
          const Icon = isActive ? SHELL_ICONS[icon].Filled : SHELL_ICONS[icon].Outline;
          return (
            <li key={href}>
              <Link
                href={href}
                onClick={onNavigate}
                aria-current={isActive ? "page" : undefined}
                className={cn(
                  "flex items-center gap-3 rounded-[var(--radius-md)] border-l-2 py-2 pl-2.5 pr-3 text-sm font-medium transition-colors",
                  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-brand-blue)]",
                  isActive
                    ? "border-[var(--color-brand-blue)] bg-surface-sunken text-text-primary"
                    : "border-transparent text-text-secondary hover:bg-surface-muted hover:text-text-primary",
                )}
              >
                <Icon className={cn("h-[18px] w-[18px] shrink-0", isActive ? "text-[var(--color-brand-blue-text)]" : "text-text-secondary")} aria-hidden="true" />
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
