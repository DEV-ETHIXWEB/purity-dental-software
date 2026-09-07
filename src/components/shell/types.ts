import type { ShellIconKey } from "./icon-map";

/** A single primary-navigation entry in the portal sidebar. */
export interface ShellNavItem {
  href: string;
  label: string;
  icon: ShellIconKey;
}

/** Minimal shape needed to render the TopBar's identity + avatar. */
export interface ShellUser {
  name: string;
  avatarUrl?: string;
  /** Human-readable role label shown in the sidebar's account area (e.g. "Dentist"). */
  role?: string;
}

/**
 * Per-portal configuration passed into the shared shell by each route
 * group layout (a Server Component). Icons are referenced by string key
 * (see `icon-map.ts`) rather than component reference, because Server
 * Components cannot pass function props into Client Components.
 */
export interface ShellConfig {
  /** Primary nav items shown in the sidebar / mobile drawer, in order. */
  navItems: ShellNavItem[];
  /** Route the logo links to (usually the portal's dashboard). */
  homeHref: string;
  /** Identity shown in the top bar (and used for the avatar). */
  user: ShellUser;
  /** Placeholder text for the top bar's global search input. */
  searchPlaceholder?: string;
  /** Primary top-bar call-to-action button. Omit to hide it entirely. `href` is required — a button with nothing to link to is dead UI. */
  primaryAction?: {
    label: string;
    icon: ShellIconKey;
    href: string;
  };
  /** This portal's patient list route — the top bar's search form submits here as `?q=`. */
  patientsHref: string;
  /** This portal's Messages route, if it has one (Hygienist/Patient only) — shows the top bar's Messages icon. Omit to hide it. */
  messagesHref?: string;
  /** Whether to show the top bar notification dot — computed server-side from real unread messages / overdue follow-ups, never hardcoded on. */
  hasUnreadNotifications?: boolean;
}
