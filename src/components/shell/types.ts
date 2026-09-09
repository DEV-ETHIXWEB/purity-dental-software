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
 * One row in the top bar's notification popup. Derived server-side from
 * real records (see `lib/data/notifications.ts`) — never stored, so these
 * are plain serializable values crossing the server/client boundary.
 */
export interface ShellNotification {
  id: string;
  kind: "message" | "recall" | "billing" | "appointment";
  title: string;
  /** Secondary line: a relative time, or a short qualifier. */
  meta: string;
  href: string;
  /** Sort weight (epoch ms). Server-side only concern, but travels with the item. */
  sortKey: number;
  /** Drives the dot and the Unread filter — "still outstanding", not per-user read state. */
  unread: boolean;
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
  /**
   * Destinations for the phone/tablet bottom tab bar, in order. Omit to
   * leave a portal on the hamburger drawer alone. Keep it to 5 at most —
   * past that the targets get too narrow to hit reliably, which is why
   * this is a separate (usually shorter) list rather than `navItems`.
   */
  bottomNavItems?: ShellNavItem[];
  /** Route the logo links to (usually the portal's dashboard). */
  homeHref: string;
  /** Identity shown in the top bar (and used for the avatar). */
  user: ShellUser;
  /**
   * Whether the top bar shows its global search. Defaults to true, so a
   * portal only has to opt out. The Patient portal does: its search had no
   * target that reads `?q` (it submitted to the appointments list, which
   * ignores it), and a search box that returns nothing is worse than none.
   */
  showSearch?: boolean;
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
  /** Where the top bar's avatar menu sends the user to view their profile — each portal's Settings page, which leads with the Profile card. */
  profileHref: string;
  /** This portal's Messages route, if it has one (Hygienist/Patient only) — shows the top bar's Messages icon. Omit to hide it. */
  messagesHref?: string;
  /** Whether to show the top bar notification dot — computed server-side from real unread messages / overdue follow-ups, never hardcoded on. */
  hasUnreadNotifications?: boolean;
  /** Rows for the top bar's notification popup. Empty renders an honest empty state. */
  notifications?: ShellNotification[];
}
