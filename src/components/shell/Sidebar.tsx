"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogOut } from "lucide-react";
import { Logo } from "@/components/ui/Logo";
import { cn } from "@/lib/cn";
import { SHELL_ICONS } from "./icon-map";
import type { ShellNavItem } from "./types";

export interface SidebarProps {
  navItems: ShellNavItem[];
  homeHref: string;
  /** Rendered inside a mobile drawer (adds a close affordance via parent) vs. the fixed desktop rail. */
  variant?: "desktop" | "drawer";
  onNavigate?: () => void;
}

export function Sidebar({ navItems, homeHref, variant = "desktop", onNavigate }: SidebarProps) {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Primary"
      className={cn(
        "flex h-full flex-col gap-6 bg-surface",
        variant === "desktop" && "w-64 border-r border-border px-4 py-6",
        variant === "drawer" && "w-72 px-4 py-6",
      )}
    >
      <Link
        href={homeHref}
        onClick={onNavigate}
        className="flex items-center gap-2 px-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-brand-blue)] rounded-[var(--radius-md)]"
      >
        <Logo height={36} />
      </Link>

      <ul className="flex flex-1 flex-col gap-1">
        {navItems.map(({ href, label, icon }) => {
          const Icon = SHELL_ICONS[icon];
          const isActive = pathname === href || pathname.startsWith(`${href}/`);
          return (
            <li key={href}>
              <Link
                href={href}
                onClick={onNavigate}
                aria-current={isActive ? "page" : undefined}
                className={cn(
                  "flex items-center gap-3 rounded-[var(--radius-md)] px-3 py-2.5 text-sm font-medium transition-colors",
                  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-brand-blue)]",
                  isActive
                    ? "bg-info-bg text-[var(--color-brand-blue-text)]"
                    : "text-text-secondary hover:bg-surface-muted hover:text-text-primary",
                )}
              >
                <Icon className="h-5 w-5 shrink-0" aria-hidden="true" />
                {label}
              </Link>
            </li>
          );
        })}
      </ul>

      <button
        type="button"
        className={cn(
          "flex items-center gap-3 rounded-[var(--radius-md)] px-3 py-2.5 text-sm font-medium text-text-secondary transition-colors",
          "hover:bg-surface-muted hover:text-text-primary",
          "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-brand-blue)]",
        )}
      >
        <LogOut className="h-5 w-5 shrink-0" aria-hidden="true" />
        Logout
      </button>
    </nav>
  );
}
