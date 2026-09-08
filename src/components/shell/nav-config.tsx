import type { ShellConfig, ShellUser } from "./types";

/**
 * Per-portal shell configuration. Each route group layout resolves the
 * signed-in user's real identity (name/avatar) via `requirePortalRole()`
 * and passes it in here — nav items/search copy/primary action are static
 * per portal, so those stay hardcoded, but identity is never hardcoded.
 * Icons are referenced by string key (see `icon-map.ts`) since layouts are
 * Server Components and can't pass component references into the client
 * `PortalShell`.
 */
export function dentistShellConfig(user: ShellUser, hasUnreadNotifications = false): ShellConfig {
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
    searchPlaceholder: "Search patients, appointments, invoices…",
    primaryAction: { label: "New Appointment", icon: "plus", href: "/schedule" },
    patientsHref: "/patients",
    profileHref: "/settings",
    hasUnreadNotifications,
  };
}

export function hygienistShellConfig(user: ShellUser, hasUnreadNotifications = false): ShellConfig {
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
    searchPlaceholder: "Search patients, appointments, invoices…",
    primaryAction: { label: "New Appointment", icon: "plus", href: "/hygienist/schedule" },
    patientsHref: "/hygienist/patients",
    profileHref: "/hygienist/settings",
    messagesHref: "/hygienist/messages",
    hasUnreadNotifications,
  };
}

/**
 * Receptionist portal: front-desk operations across the whole practice
 * (every provider, not just one) — check-in, registration, the practice-wide
 * calendar, and payment collection. No clinical charting nav items.
 */
export function receptionistShellConfig(user: ShellUser, hasUnreadNotifications = false): ShellConfig {
  return {
    homeHref: "/receptionist/dashboard",
    navItems: [
      { href: "/receptionist/dashboard", label: "Dashboard", icon: "dashboard" },
      { href: "/receptionist/schedule", label: "Schedule", icon: "schedule" },
      { href: "/receptionist/patients", label: "Patients", icon: "patients" },
      { href: "/receptionist/billing", label: "Billing", icon: "billing" },
      { href: "/receptionist/settings", label: "Settings", icon: "settings" },
    ],
    user,
    searchPlaceholder: "Search patients, appointments, invoices…",
    primaryAction: {
      label: "Register Patient",
      icon: "userPlus",
      href: "/receptionist/patients/new",
    },
    patientsHref: "/receptionist/patients",
    profileHref: "/receptionist/settings",
    hasUnreadNotifications,
  };
}

/**
 * Patient portal: a single signed-in patient's own view of their care, not a
 * clinical/operational tool — nav is intentionally short (no "Patients"
 * list, no charting). "Notifications" rides the TopBar's existing bell icon
 * rather than a nav item; "Need Help" lives as an in-page card on the
 * dashboard rather than its own route.
 */
export function patientShellConfig(user: ShellUser, hasUnreadNotifications = false): ShellConfig {
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
    user,
    searchPlaceholder: "Search your appointments, records…",
    primaryAction: {
      label: "Book Appointment",
      icon: "plus",
      href: "/patient/appointments",
    },
    patientsHref: "/patient/appointments",
    profileHref: "/patient/settings",
    messagesHref: "/patient/messages",
    hasUnreadNotifications,
  };
}
