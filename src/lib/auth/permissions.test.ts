import { describe, it, expect } from "vitest";
import type { UserRole } from "@/generated/prisma/client";
import {
  PERMISSION_KEYS,
  PERMISSIONS,
  PERMISSION_GROUPS,
  defaultPermissionsForRole,
  roleHasByDefault,
  parseOverrides,
  effectivePermissions,
  hasPermission,
} from "./permissions";

describe("role defaults", () => {
  it("gives ADMIN every permission", () => {
    expect(defaultPermissionsForRole("ADMIN")).toHaveLength(PERMISSION_KEYS.length);
    for (const key of PERMISSION_KEYS) {
      expect(roleHasByDefault("ADMIN", key)).toBe(true);
    }
  });

  it("gives PATIENT none — patient access is scoped by record ownership, not staff permissions", () => {
    expect(defaultPermissionsForRole("PATIENT")).toHaveLength(0);
  });

  it("keeps staff administration to admins", () => {
    for (const role of ["DENTIST", "HYGIENIST", "RECEPTIONIST"] as const) {
      expect(roleHasByDefault(role, "staff.manage")).toBe(false);
      expect(roleHasByDefault(role, "permissions.manage")).toBe(false);
      expect(roleHasByDefault(role, "practice.manage")).toBe(false);
      expect(roleHasByDefault(role, "audit.view")).toBe(false);
    }
  });

  /*
   * The defaults must reproduce the role lists the actions used BEFORE they
   * were converted from `requireRole` to `requirePermission`. Wiring the
   * gates up was explicitly not meant to take anything away from anyone, so
   * each case below is the old `requireRole([...])` argument written as the
   * permission that replaced it. A failure here means a conversion silently
   * changed who can do something.
   */
  it("reproduces the pre-conversion role lists exactly", () => {
    const cases: [string, (typeof PERMISSION_KEYS)[number], UserRole[]][] = [
      // requireRole(["DENTIST","HYGIENIST","RECEPTIONIST","ADMIN"])
      ["book/move/resolve appointment", "schedule.manage", ["DENTIST", "HYGIENIST", "RECEPTIONIST"]],
      // set-patient-status, updatePatientContact, updatePatientBilling
      ["edit patient", "patients.manage", ["DENTIST", "HYGIENIST", "RECEPTIONIST"]],
      // documents, prescriptions, consent forms (was [...STAFF])
      ["clinical records", "clinical.manage", ["DENTIST", "HYGIENIST", "RECEPTIONIST"]],
      // mark-invoice-paid staff branch
      ["record payment", "billing.recordPayment", ["DENTIST", "HYGIENIST", "RECEPTIONIST"]],
      // requireRole(["DENTIST","HYGIENIST","ADMIN"])
      ["create invoice", "billing.manage", ["DENTIST", "HYGIENIST"]],
      ["log treatment", "treatment.log", ["DENTIST", "HYGIENIST"]],
      // requireRole(["RECEPTIONIST","ADMIN"])
      ["register / edit demographics", "patients.register", ["RECEPTIONIST"]],
    ];

    const everyStaffRole: UserRole[] = ["DENTIST", "HYGIENIST", "RECEPTIONIST"];
    for (const [what, permission, allowed] of cases) {
      for (const role of everyStaffRole) {
        expect(
          roleHasByDefault(role, permission),
          `${role} ${allowed.includes(role) ? "lost" : "gained"} "${what}"`,
        ).toBe(allowed.includes(role));
      }
      // ADMIN holds everything, by construction.
      expect(roleHasByDefault("ADMIN", permission)).toBe(true);
    }
  });

  it("keeps the Team page with the front desk, and out of clinicians' hands", () => {
    // /receptionist/providers was requireRole([RECEPTIONIST, ADMIN]); the
    // permission that replaced it has to match that exactly.
    expect(roleHasByDefault("RECEPTIONIST", "providers.manage")).toBe(true);
    expect(roleHasByDefault("ADMIN", "providers.manage")).toBe(true);
    expect(roleHasByDefault("DENTIST", "providers.manage")).toBe(false);
    expect(roleHasByDefault("HYGIENIST", "providers.manage")).toBe(false);
  });

  it("keeps staff.manage separate from providers.manage", () => {
    // The two staff systems stay distinct: the front desk can onboard
    // clinicians without gaining the Admin portal's full staff control.
    expect(roleHasByDefault("RECEPTIONIST", "staff.manage")).toBe(false);
  });

  it("keeps messaging.grant with the front desk only", () => {
    expect(roleHasByDefault("RECEPTIONIST", "messaging.grant")).toBe(true);
    expect(roleHasByDefault("DENTIST", "messaging.grant")).toBe(false);
    expect(roleHasByDefault("HYGIENIST", "messaging.grant")).toBe(false);
  });

  it("describes every permission it declares, in a known group", () => {
    for (const key of PERMISSION_KEYS) {
      const permission = PERMISSIONS[key];
      expect(permission.label.length).toBeGreaterThan(0);
      expect(permission.description.length).toBeGreaterThan(0);
      expect(PERMISSION_GROUPS).toContain(permission.group);
    }
  });
});

describe("parseOverrides", () => {
  it("returns an empty map for null, undefined and non-objects", () => {
    expect(parseOverrides(null)).toEqual({});
    expect(parseOverrides(undefined)).toEqual({});
    expect(parseOverrides("billing.manage")).toEqual({});
    expect(parseOverrides(42)).toEqual({});
  });

  it("ignores arrays, which would otherwise pass a bare typeof object check", () => {
    expect(parseOverrides(["billing.manage"])).toEqual({});
  });

  it("drops keys that aren't real permissions", () => {
    expect(parseOverrides({ "not.a.permission": true, "billing.manage": true })).toEqual({
      "billing.manage": true,
    });
  });

  it("drops non-boolean values rather than coercing them", () => {
    // A truthy string must not become a grant.
    expect(parseOverrides({ "billing.manage": "yes", "audit.view": 1 })).toEqual({});
  });

  it("keeps both true and false", () => {
    expect(parseOverrides({ "billing.manage": true, "messaging.grant": false })).toEqual({
      "billing.manage": true,
      "messaging.grant": false,
    });
  });
});

describe("effectivePermissions", () => {
  it("falls back to role defaults when there are no overrides", () => {
    const effective = effectivePermissions("HYGIENIST", null);
    expect(effective).toEqual(new Set(defaultPermissionsForRole("HYGIENIST")));
  });

  it("adds a permission the role lacks", () => {
    expect(roleHasByDefault("RECEPTIONIST", "billing.manage")).toBe(false);
    const effective = effectivePermissions("RECEPTIONIST", { "billing.manage": true });
    expect(effective.has("billing.manage")).toBe(true);
  });

  it("removes a permission the role would grant", () => {
    expect(roleHasByDefault("RECEPTIONIST", "messaging.grant")).toBe(true);
    const effective = effectivePermissions("RECEPTIONIST", { "messaging.grant": false });
    expect(effective.has("messaging.grant")).toBe(false);
  });

  it("can strip permissions from an admin", () => {
    // Admin is a spread of every key, not a bypass — so a deny has to bite.
    const effective = effectivePermissions("ADMIN", { "audit.view": false });
    expect(effective.has("audit.view")).toBe(false);
    expect(effective.has("staff.manage")).toBe(true);
  });

  it("leaves other permissions untouched by an override", () => {
    const before = effectivePermissions("DENTIST", null);
    const after = effectivePermissions("DENTIST", { "audit.view": true });
    for (const key of before) expect(after.has(key)).toBe(true);
    expect(after.size).toBe(before.size + 1);
  });

  it("ignores a malformed override blob rather than throwing", () => {
    expect(effectivePermissions("DENTIST", "garbage")).toEqual(
      new Set(defaultPermissionsForRole("DENTIST")),
    );
  });

  it("treats an explicit true matching the role default as a no-op", () => {
    const effective = effectivePermissions("DENTIST", { "billing.manage": true });
    expect(effective).toEqual(new Set(defaultPermissionsForRole("DENTIST")));
  });
});

describe("hasPermission", () => {
  it("reads through the role when no overrides are present", () => {
    expect(hasPermission({ role: "DENTIST" }, "billing.manage")).toBe(true);
    expect(hasPermission({ role: "DENTIST" }, "staff.manage")).toBe(false);
  });

  it("honours a grant", () => {
    expect(
      hasPermission(
        { role: "HYGIENIST", permissionOverrides: { "billing.manage": true } },
        "billing.manage",
      ),
    ).toBe(true);
  });

  it("honours a revoke", () => {
    expect(
      hasPermission(
        { role: "DENTIST", permissionOverrides: { "billing.manage": false } },
        "billing.manage",
      ),
    ).toBe(false);
  });

  it("denies a patient every staff permission", () => {
    for (const key of PERMISSION_KEYS) {
      expect(hasPermission({ role: "PATIENT" }, key)).toBe(false);
    }
  });

  it("would honour an override on a patient — which is why writing one is blocked upstream", () => {
    // Documenting the boundary rather than asserting a guarantee this module
    // does not make: the layering is that `setStaffPermission` scopes its
    // lookup to `role: { not: "PATIENT" }`, so no patient row can ever
    // acquire an override in the first place. If that scoping is ever
    // loosened, this is the behaviour it would expose.
    expect(
      hasPermission({ role: "PATIENT", permissionOverrides: { "audit.view": true } }, "audit.view"),
    ).toBe(true);
  });
});
