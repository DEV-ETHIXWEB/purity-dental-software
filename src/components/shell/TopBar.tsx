"use client";

import Link from "next/link";
import { Search, MessageSquare, Bell, Menu } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Avatar } from "@/components/ui/Avatar";
import { cn } from "@/lib/cn";
import { SHELL_ICONS } from "./icon-map";
import type { ShellConfig } from "./types";

const PRIMARY_ACTION_CLASSES =
  "inline-flex items-center rounded-[var(--radius-lg)] font-medium transition-colors disabled:opacity-50 disabled:pointer-events-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-brand-blue)] brand-gradient-bg text-white shadow-card hover:opacity-90 active:opacity-95";

export interface TopBarProps {
  onOpenMobileNav: () => void;
  user: ShellConfig["user"];
  searchPlaceholder?: string;
  primaryAction?: ShellConfig["primaryAction"];
}

export function TopBar({ onOpenMobileNav, user, searchPlaceholder, primaryAction }: TopBarProps) {
  const PrimaryIcon = primaryAction ? SHELL_ICONS[primaryAction.icon] : undefined;

  return (
    <header className="flex h-16 items-center gap-3 border-b border-border bg-surface px-4 sm:px-6">
      <button
        type="button"
        onClick={onOpenMobileNav}
        aria-label="Open navigation menu"
        className="rounded-[var(--radius-md)] p-2 text-text-secondary hover:bg-surface-muted lg:hidden focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-brand-blue)]"
      >
        <Menu className="h-5 w-5" aria-hidden="true" />
      </button>

      <div className="relative hidden flex-1 max-w-md sm:block">
        <Search
          className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-secondary"
          aria-hidden="true"
        />
        <label htmlFor="global-search" className="sr-only">
          {searchPlaceholder ?? "Search"}
        </label>
        <input
          id="global-search"
          type="search"
          placeholder={searchPlaceholder ?? "Search…"}
          className="h-10 w-full rounded-[var(--radius-md)] border border-border bg-surface-muted pl-9 pr-3 text-sm text-text-primary placeholder:text-text-secondary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-brand-blue)]"
        />
      </div>

      <div className="flex flex-1 items-center justify-end gap-2 sm:flex-none">
        <button
          type="button"
          aria-label="Search"
          className="rounded-[var(--radius-md)] p-2 text-text-secondary hover:bg-surface-muted sm:hidden focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-brand-blue)]"
        >
          <Search className="h-5 w-5" aria-hidden="true" />
        </button>
        <button
          type="button"
          aria-label="Messages"
          className="rounded-[var(--radius-md)] p-2 text-text-secondary hover:bg-surface-muted focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-brand-blue)]"
        >
          <MessageSquare className="h-5 w-5" aria-hidden="true" />
        </button>
        <button
          type="button"
          aria-label="Notifications"
          className="relative rounded-[var(--radius-md)] p-2 text-text-secondary hover:bg-surface-muted focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-brand-blue)]"
        >
          <Bell className="h-5 w-5" aria-hidden="true" />
          <span
            className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-error"
            aria-hidden="true"
          />
          <span className="sr-only">You have unread notifications</span>
        </button>

        {primaryAction && PrimaryIcon ? (
          primaryAction.href ? (
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
          ) : (
            <>
              <Button size="sm" className="hidden sm:inline-flex">
                <PrimaryIcon className="h-4 w-4" aria-hidden="true" />
                {primaryAction.label}
              </Button>
              <Button size="icon" aria-label={primaryAction.label} className="sm:hidden">
                <PrimaryIcon className="h-5 w-5" aria-hidden="true" />
              </Button>
            </>
          )
        ) : null}

        <div className="ml-1 flex items-center gap-2 border-l border-border pl-3">
          <Avatar name={user.name} src={user.avatarUrl} size="sm" />
          <span className="hidden text-sm font-medium text-text-primary md:inline">
            {user.name}
          </span>
        </div>
      </div>
    </header>
  );
}
