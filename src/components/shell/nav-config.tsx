import type { ShellConfig, ShellNotification, ShellUser } from "./types";

/**
 * Per-portal shell configuration. Each route group layout resolves the
 * signed-in user's real identity (name/avatar) via `requirePortalRole()`
 * and passes it in here — nav items/search copy/primary action are static
 * per portal, so those stay hardcoded, but identity is never hardcoded.
 * Icons are referenced by string key (see `icon-map.ts`) since layouts are
 * Server Components and can't pass component references into the client
 * `PortalShell`.
 */
export function dentistShellConfig(
  user: ShellUser,
  hasUnreadNotifications = false,
  notifications: ShellNotification[] = [],
): ShellConfig {
  return {
    homeHref: "/dashboard",
    navItems: [
      { href: "/dashboard", label: "Dashboard", icon: "dashboard" },
      { href: "/schedule", label: "My Schedule", icon: "schedule" },
      { href: "/patients", label: "Patients", icon: "patients" },
      { href: "/billing", label: "Billing", icon: "billing" },
      { href: "/settings", label: "Settings", icon: "settings" },
    ],
    user,
    searchPlaceholder: "Search patients by name, email, or phone…",
    primaryAction: { label: "New Appointment", icon: "plus", href: "/schedule" },
    // Settings is deliberately absent, matching the Patient portal: it's one
    // tap away in the top bar's avatar menu, and a further tab would squeeze
    // the rest. Labels are shortened for a 5-up bar on a 375px screen.
    bottomNavItems: [
      { href: "/dashboard", label: "Home", icon: "dashboard" },
      { href: "/schedule", label: "Schedule", icon: "schedule" },
      { href: "/patients", label: "Patients", icon: "patients" },
      { href: "/billing", label: "Billing", icon: "billing" },
    ],
    patientsHref: "/patients",
    profileHref: "/settings",
    hasUnreadNotifications,
    notifications,
  };
}

export function hygienistShellConfig(
  user: ShellUser,
  hasUnreadNotifications = false,
  notifications: ShellNotification[] = [],
): ShellConfig {
  return {
    homeHref: "/hygienist/dashboard",
    navItems: [
      { href: "/hygienist/dashboard", label: "Dashboard", icon: "dashboard" },
      { href: "/hygienist/schedule", label: "Schedule", icon: "schedule" },
      { href: "/hygienist/patients", label: "Patients", icon: "patients" },
      { href: "/hygienist/messages", label: "Messages", icon: "messages" },
      { href: "/hygienist/billing", label: "Billing", icon: "billing" },
      { href: "/hygienist/settings", label: "Settings", icon: "settings" },
    ],
    user,
    searchPlaceholder: "Search patients by name, email, or phone…",
    primaryAction: { label: "New Appointment", icon: "plus", href: "/hygienist/schedule" },
    // Settings is deliberately absent, matching the Patient portal: it's one
    // tap away in the top bar's avatar menu, and a further tab would squeeze
    // the rest. Labels are shortened for a 5-up bar on a 375px screen.
    bottomNavItems: [
      { href: "/hygienist/dashboard", label: "Home", icon: "dashboard" },
      { href: "/hygienist/schedule", label: "Schedule", icon: "schedule" },
      { href: "/hygienist/patients", label: "Patients", icon: "patients" },
      { href: "/hygienist/messages", label: "Messages", icon: "messages" },
      { href: "/hygienist/billing", label: "Billing", icon: "billing" },
    ],
    patientsHref: "/hygienist/patients",
    profileHref: "/hygienist/settings",
    messagesHref: "/hygienist/messages",
    hasUnreadNotifications,
    notifications,
  };
}

/**
 * Receptionist portal: front-desk operations across the whole practice
 * (every provider, not just one) — check-in, registration, the practice-wide
 * calendar, and payment collection. No clinical charting nav items.
 */
export function receptionistShellConfig(
  user: ShellUser,
  hasUnreadNotifications = false,
  notifications: ShellNotification[] = [],
): ShellConfig {
  return {
    homeHref: "/receptionist/dashboard",
    navItems: [
      { href: "/receptionist/dashboard", label: "Dashboard", icon: "dashboard" },
      { href: "/receptionist/schedule", label: "Schedule", icon: "schedule" },
      { href: "/receptionist/patients", label: "Patients", icon: "patients" },
      { href: "/receptionist/providers", label: "Team", icon: "userPlus" },
      { href: "/receptionist/billing", label: "Billing", icon: "billing" },
      { href: "/receptionist/settings", label: "Settings", icon: "settings" },
    ],
    user,
    searchPlaceholder: "Search patients by name, email, or phone…",
    primaryAction: {
      label: "Register Patient",
      icon: "userPlus",
      href: "/receptionist/patients/new",
    },
    patientsHref: "/receptionist/patients",
    // Settings is deliberately absent, matching the Patient portal: it's one
    // tap away in the top bar's avatar menu, and a further tab would squeeze
    // the rest. Labels are shortened for a 5-up bar on a 375px screen.
    bottomNavItems: [
      { href: "/receptionist/dashboard", label: "Home", icon: "dashboard" },
      { href: "/receptionist/schedule", label: "Schedule", icon: "schedule" },
      { href: "/receptionist/patients", label: "Patients", icon: "patients" },
      { href: "/receptionist/providers", label: "Team", icon: "userPlus" },
      { href: "/receptionist/billing", label: "Billing", icon: "billing" },
    ],
    profileHref: "/receptionist/settings",
    hasUnreadNotifications,
    notifications,
  };
}

/**
 * Patient portal: a single signed-in patient's own view of their care, not a
 * clinical/operational tool — nav is intentionally short (no "Patients"
 * list, no charting). "Notifications" rides the TopBar's existing bell icon
 * rather than a nav item; "Need Help" lives as an in-page card on the
 * dashboard rather than its own route.
 */
export function patientShellConfig(
  user: ShellUser,
  hasUnreadNotifications = false,
  notifications: ShellNotification[] = [],
): ShellConfig {
  return {
    homeHref: "/patient/dashboard",
    navItems: [
      { href: "/patient/dashboard", label: "Dashboard", icon: "dashboard" },
      { href: "/patient/appointments", label: "Appointments", icon: "schedule" },
      { href: "/patient/care", label: "My Care", icon: "care" },
      { href: "/patient/messages", label: "Messages", icon: "messages" },
      { href: "/patient/billing", label: "Bills", icon: "billing" },
      { href: "/patient/settings", label: "Settings", icon: "settings" },
    ],
    // Settings is deliberately absent: it's one tap away in the top bar's
    // avatar menu and in the drawer, and a 6th tab would squeeze the rest.
    bottomNavItems: [
      { href: "/patient/dashboard", label: "Home", icon: "dashboard" },
      { href: "/patient/appointments", label: "Appointments", icon: "schedule" },
      { href: "/patient/care", label: "My Care", icon: "care" },
      { href: "/patient/messages", label: "Messages", icon: "messages" },
      { href: "/patient/billing", label: "Bills", icon: "billing" },
    ],
    user,
    // No search and no "+" action here, unlike the staff portals. Both
    // pointed at /patient/appointments, which the Appointments tab, the
    // dashboard's "Book appointment" tile and its hero CTA already reach —
    // and the search query was never read by that page. `patientsHref`
    // stays as the notification bell's fallback target.
    showSearch: false,
    patientsHref: "/patient/appointments",
    profileHref: "/patient/settings",
    messagesHref: "/patient/messages",
    hasUnreadNotifications,
    notifications,
  };
}
