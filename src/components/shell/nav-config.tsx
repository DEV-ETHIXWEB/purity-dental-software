import type { ShellConfig } from "./types";
import { currentProvider, currentHygienist, currentPatient, patientFullName } from "@/lib/sample-data";

/**
 * Per-portal shell configuration. Each route group layout imports its own
 * config and passes it to `<PortalShell />` — keeps the nav items/identity
 * for Dentist, Hygienist, Receptionist, and Patient in one obvious place
 * rather than duplicated inline in every layout file. Icons are referenced
 * by string key (see `icon-map.ts`) since layouts are Server Components and
 * can't pass component references into the client `PortalShell`.
 */
export const dentistShellConfig: ShellConfig = {
  homeHref: "/dashboard",
  navItems: [
    { href: "/dashboard", label: "Dashboard", icon: "dashboard" },
    { href: "/schedule", label: "My Schedule", icon: "schedule" },
    { href: "/patients", label: "Patients", icon: "patients" },
    { href: "/billing", label: "Billing", icon: "billing" },
    { href: "/settings", label: "Settings", icon: "settings" },
  ],
  user: { name: currentProvider.name, avatarUrl: currentProvider.avatarUrl },
  searchPlaceholder: "Search patients, appointments, invoices…",
  primaryAction: { label: "New Appointment", icon: "plus" },
};

export const hygienistShellConfig: ShellConfig = {
  homeHref: "/hygienist/dashboard",
  navItems: [
    { href: "/hygienist/dashboard", label: "Dashboard", icon: "dashboard" },
    { href: "/hygienist/schedule", label: "Schedule", icon: "schedule" },
    { href: "/hygienist/patients", label: "Patients", icon: "patients" },
    { href: "/hygienist/messages", label: "Messages", icon: "messages" },
    { href: "/hygienist/billing", label: "Billing", icon: "billing" },
    { href: "/hygienist/settings", label: "Settings", icon: "settings" },
  ],
  user: { name: currentHygienist.name, avatarUrl: currentHygienist.avatarUrl },
  searchPlaceholder: "Search patients, appointments, invoices…",
  primaryAction: { label: "New Appointment", icon: "plus" },
};

/**
 * Receptionist portal: front-desk operations across the whole practice
 * (every provider, not just one) — check-in, registration, the practice-wide
 * calendar, and payment collection. No clinical charting nav items.
 */
export const receptionistShellConfig: ShellConfig = {
  homeHref: "/receptionist/dashboard",
  navItems: [
    { href: "/receptionist/dashboard", label: "Dashboard", icon: "dashboard" },
    { href: "/receptionist/schedule", label: "Schedule", icon: "schedule" },
    { href: "/receptionist/patients", label: "Patients", icon: "patients" },
    { href: "/receptionist/billing", label: "Billing", icon: "billing" },
    { href: "/receptionist/settings", label: "Settings", icon: "settings" },
  ],
  user: { name: "Priya Nair", avatarUrl: undefined },
  searchPlaceholder: "Search patients, appointments, invoices…",
  primaryAction: {
    label: "Register Patient",
    icon: "userPlus",
    href: "/receptionist/patients/new",
  },
};

/**
 * Patient portal: a single signed-in patient's own view of their care, not a
 * clinical/operational tool — nav is intentionally short (no "Patients"
 * list, no charting). "Notifications" rides the TopBar's existing bell icon
 * rather than a nav item; "Need Help" lives as an in-page card on the
 * dashboard rather than its own route.
 */
export const patientShellConfig: ShellConfig = {
  homeHref: "/patient/dashboard",
  navItems: [
    { href: "/patient/dashboard", label: "Dashboard", icon: "dashboard" },
    { href: "/patient/appointments", label: "Appointments", icon: "schedule" },
    { href: "/patient/care", label: "My Care", icon: "care" },
    { href: "/patient/messages", label: "Messages", icon: "messages" },
    { href: "/patient/billing", label: "Bills", icon: "billing" },
    { href: "/patient/settings", label: "Settings", icon: "settings" },
  ],
  user: { name: patientFullName(currentPatient), avatarUrl: currentPatient.photoUrl },
  searchPlaceholder: "Search your appointments, records…",
  primaryAction: {
    label: "Book Appointment",
    icon: "plus",
    href: "/patient/appointments",
  },
};
