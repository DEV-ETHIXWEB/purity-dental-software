import type { UserRole } from "@/generated/prisma/client";

/**
 * What a staff member is allowed to do, independent of which portal they
 * sign into.
 *
 * Roles stay the coarse grouping — they decide which portal you land in and
 * what you get by default — but a practice needs exceptions: the receptionist
 * who also reconciles invoices, the hygienist who shouldn't see billing at
 * all. So the effective answer is the role's default set, with per-person
 * overrides layered on top (`User.permissionOverrides`).
 *
 * Defaults live in code rather than in the database on purpose. They're
 * product decisions, not practice data: changing what a hygienist can do by
 * default should be one edit here that applies to every hygienist who has
 * never been given an explicit override, not a migration.
 */
export const PERMISSIONS = {
  "schedule.manage": {
    label: "Manage the schedule",
    description: "Book, move and cancel appointments.",
    group: "Clinic",
  },
  "patients.view": {
    label: "View patients",
    description: "Open patient records and clinical history.",
    group: "Patients",
  },
  "patients.manage": {
    label: "Edit patients",
    description: "Change patient details and set Active, Completed or Archived.",
    group: "Patients",
  },
  "patients.register": {
    label: "Register patients",
    description: "Add a new patient to the practice.",
    group: "Patients",
  },
  "clinical.manage": {
    label: "Manage clinical records",
    description: "Documents, prescriptions and consent forms.",
    group: "Patients",
  },
  "treatment.log": {
    label: "Log treatment",
    description: "Record completed treatment, which also raises its invoice.",
    group: "Patients",
  },
  "billing.view": {
    label: "View billing",
    description: "See invoices, balances and practice revenue.",
    group: "Billing",
  },
  "billing.manage": {
    label: "Manage billing",
    description: "Create and edit invoices.",
    group: "Billing",
  },
  "billing.recordPayment": {
    label: "Record payments",
    description: "Mark an invoice as paid.",
    group: "Billing",
  },
  "messaging.reply": {
    label: "Reply to patients",
    description: "Read and answer patient message threads.",
    group: "Messaging",
  },
  "messaging.grant": {
    label: "Grant patient messaging",
    description: "Decide which patients may message the care team.",
    group: "Messaging",
  },
  "providers.manage": {
    label: "Manage clinicians",
    description: "Add dentists and hygienists from the Team page, and switch their accounts on or off.",
    group: "Administration",
  },
  "staff.manage": {
    label: "Manage staff",
    description: "Add staff, edit their details and deactivate accounts.",
    group: "Administration",
  },
  "permissions.manage": {
    label: "Manage permissions",
    description: "Change what other staff members are allowed to do.",
    group: "Administration",
  },
  "audit.view": {
    label: "View the audit log",
    description: "See the record of who changed what.",
    group: "Administration",
  },
  "practice.manage": {
    label: "Manage practice settings",
    description: "Practice name, timezone and contact details.",
    group: "Administration",
  },
} as const;

export type PermissionKey = keyof typeof PERMISSIONS;

export const PERMISSION_KEYS = Object.keys(PERMISSIONS) as PermissionKey[];

/** Display order for the permission groups, so the admin UI reads consistently. */
export const PERMISSION_GROUPS = ["Clinic", "Patients", "Billing", "Messaging", "Administration"] as const;

/**
 * What each role can do before any per-person override.
 *
 * ADMIN is deliberately spread from every key rather than special-cased with
 * an `if (role === "ADMIN") return true` somewhere: a new permission added
 * above is then automatically an admin one, and — more importantly — an
 * admin's set stays visible and explicit in the UI instead of being an
 * invisible bypass.
 *
 * PATIENT holds none of these. Patient access is scoped by ownership of
 * their own record, not by staff permissions, and is enforced separately.
 */
const ROLE_DEFAULTS: Record<UserRole, readonly PermissionKey[]> = {
  ADMIN: PERMISSION_KEYS,
  DENTIST: [
    "schedule.manage",
    "patients.view",
    "patients.manage",
    "clinical.manage",
    "treatment.log",
    "billing.view",
    "billing.manage",
    "billing.recordPayment",
    "messaging.reply",
  ],
  HYGIENIST: [
    "schedule.manage",
    "patients.view",
    // Hygienists hold these because they already did before permissions
    // existed: the actions behind them were gated on a role list that
    // included HYGIENIST, and wiring the gates up was not meant to take
    // anything away. Narrow them here if that was never intended.
    "patients.manage",
    "clinical.manage",
    "treatment.log",
    "billing.view",
    "billing.manage",
    "billing.recordPayment",
    "messaging.reply",
  ],
  RECEPTIONIST: [
    "schedule.manage",
    "patients.view",
    "patients.manage",
    "patients.register",
    // Same reasoning as the hygienist note above: the front desk could
    // already upload documents, issue consent forms and record payments.
    "clinical.manage",
    "billing.view",
    "billing.recordPayment",
    "messaging.reply",
    "messaging.grant",
    // The Team page was gated on requireRole([RECEPTIONIST, ADMIN]); this
    // keeps the front desk able to onboard a clinician while making it
    // something an admin can now revoke.
    "providers.manage",
  ],
  PATIENT: [],
};

export function defaultPermissionsForRole(role: UserRole): readonly PermissionKey[] {
  return ROLE_DEFAULTS[role] ?? [];
}

/** Whether a role holds a permission by default, before overrides. */
export function roleHasByDefault(role: UserRole, key: PermissionKey): boolean {
  return defaultPermissionsForRole(role).includes(key);
}

/**
 * Narrows the untyped JSON column into the override shape, dropping anything
 * that isn't a known permission mapped to a boolean.
 *
 * Defensive because this is a `Json?` column: it can hold whatever was
 * written to it by an older build, and a stray key must not be able to
 * fabricate a permission that no longer exists.
 */
export function parseOverrides(raw: unknown): Partial<Record<PermissionKey, boolean>> {
  if (typeof raw !== "object" || raw === null || Array.isArray(raw)) return {};
  const out: Partial<Record<PermissionKey, boolean>> = {};
  for (const [key, value] of Object.entries(raw as Record<string, unknown>)) {
    if (typeof value === "boolean" && (PERMISSION_KEYS as string[]).includes(key)) {
      out[key as PermissionKey] = value;
    }
  }
  return out;
}

/** The role's defaults with this person's overrides applied on top. */
export function effectivePermissions(role: UserRole, rawOverrides: unknown): Set<PermissionKey> {
  const overrides = parseOverrides(rawOverrides);
  const result = new Set<PermissionKey>(defaultPermissionsForRole(role));
  for (const key of PERMISSION_KEYS) {
    const override = overrides[key];
    if (override === true) result.add(key);
    if (override === false) result.delete(key);
  }
  return result;
}

/**
 * The same set as `effectivePermissions`, flattened for the client.
 *
 * `PermissionsProvider` crosses the server/client boundary, where a `Set`
 * is not serializable — so the staff layouts hand it this array.
 */
export function permissionListFor(user: {
  role: UserRole;
  permissionOverrides?: unknown;
}): PermissionKey[] {
  return [...effectivePermissions(user.role, user.permissionOverrides)];
}

/** Whether this user holds a permission, accounting for their overrides. */
export function hasPermission(
  user: { role: UserRole; permissionOverrides?: unknown },
  key: PermissionKey,
): boolean {
  return effectivePermissions(user.role, user.permissionOverrides).has(key);
}
