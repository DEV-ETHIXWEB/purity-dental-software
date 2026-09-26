"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/auth/authorize";
import { writeAuditLog } from "@/lib/auth/audit-log";
import { hashPassword } from "@/lib/auth/password";
import { activeAdminCount } from "@/lib/data/staff";
import { PERMISSION_KEYS, parseOverrides, type PermissionKey } from "@/lib/auth/permissions";
import { Prisma, type UserRole } from "@/generated/prisma/client";

export interface StaffActionResult {
  ok: boolean;
  error?: string;
  /** Set on a successful create, so the caller can navigate to the new record. */
  userId?: string;
}

/** Roles an admin may assign. PATIENT is excluded: patient accounts are created through registration, which also builds the clinical record a bare user row wouldn't have. */
const ASSIGNABLE_ROLES: readonly UserRole[] = ["ADMIN", "DENTIST", "HYGIENIST", "RECEPTIONIST"];

const ADMIN_PATHS = [
  "/admin/staff",
  "/admin/dashboard",
  "/admin/audit",
  "/receptionist/providers",
];

function revalidateAdmin(userId?: string) {
  for (const path of ADMIN_PATHS) revalidatePath(path);
  if (userId) revalidatePath(`/admin/staff/${userId}`);
}

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

/**
 * Adds a staff member.
 *
 * Creates a real, signable account rather than an invitation: this
 * deployment has no outbound mail (see the password-reset flow, which is
 * self-service in-app for the same reason), so an "invite sent" state would
 * be a dead end. The admin sets an initial password and hands it over, and
 * the new user can change it from Settings.
 */
export async function createStaffMember(params: {
  name: string;
  email: string;
  phone?: string;
  role: UserRole;
  password: string;
}): Promise<StaffActionResult> {
  try {
    const session = await requirePermission("staff.manage");
    const organizationId = session.user.organizationId;

    const name = params.name.trim();
    const email = params.email.trim().toLowerCase();
    const phone = params.phone?.trim() || null;

    if (!name) return { ok: false, error: "Name is required." };
    if (!isValidEmail(email)) return { ok: false, error: "Enter a valid email address." };
    if (!ASSIGNABLE_ROLES.includes(params.role)) {
      return { ok: false, error: "That isn't a role you can assign." };
    }
    if (params.password.length < 12) {
      return { ok: false, error: "Password must be at least 12 characters." };
    }

    // `email` is globally unique, not per-organization, so a clash can be
    // with another practice's account. Say only that it's taken.
    const existing = await prisma.user.findUnique({ where: { email }, select: { id: true } });
    if (existing) return { ok: false, error: "That email address is already in use." };

    const created = await prisma.user.create({
      data: {
        organizationId,
        name,
        email,
        phone,
        role: params.role,
        passwordHash: await hashPassword(params.password),
      },
      select: { id: true },
    });

    await writeAuditLog({
      organizationId,
      actorUserId: session.user.id,
      action: "staff.created",
      resourceType: "User",
      resourceId: created.id,
      // Never the password or its hash.
      metadata: { name, email, role: params.role },
    });

    revalidateAdmin(created.id);
    return { ok: true, userId: created.id };
  } catch {
    return { ok: false, error: "Couldn't add this staff member. Please try again." };
  }
}

/** Edits a staff member's name, email and phone. */
export async function updateStaffMember(params: {
  userId: string;
  name: string;
  email: string;
  phone?: string;
}): Promise<StaffActionResult> {
  try {
    const session = await requirePermission("staff.manage");
    const organizationId = session.user.organizationId;

    const name = params.name.trim();
    const email = params.email.trim().toLowerCase();
    const phone = params.phone?.trim() || null;

    if (!name) return { ok: false, error: "Name is required." };
    if (!isValidEmail(email)) return { ok: false, error: "Enter a valid email address." };

    const target = await prisma.user.findFirst({
      where: { id: params.userId, organizationId, role: { not: "PATIENT" } },
      select: { id: true, name: true, email: true },
    });
    if (!target) return { ok: false, error: "That staff member is no longer in this practice." };

    if (email !== target.email) {
      const clash = await prisma.user.findUnique({ where: { email }, select: { id: true } });
      if (clash) return { ok: false, error: "That email address is already in use." };
    }

    await prisma.user.update({
      where: { id: target.id },
      data: { name, email, phone },
    });

    await writeAuditLog({
      organizationId,
      actorUserId: session.user.id,
      action: "staff.updated",
      resourceType: "User",
      resourceId: target.id,
      metadata: { from: { name: target.name, email: target.email }, to: { name, email } },
    });

    revalidateAdmin(target.id);
    return { ok: true };
  } catch {
    return { ok: false, error: "Couldn't save those changes. Please try again." };
  }
}

/**
 * Changes someone's role.
 *
 * Their permission overrides are left alone on purpose: an override is an
 * explicit decision about that person ("this one may manage billing"), and
 * silently dropping it on a role change would quietly widen or narrow what
 * they can do. The role's defaults move; the exceptions stay until an admin
 * clears them.
 */
export async function setStaffRole(params: {
  userId: string;
  role: UserRole;
}): Promise<StaffActionResult> {
  try {
    const session = await requirePermission("staff.manage");
    const organizationId = session.user.organizationId;

    if (!ASSIGNABLE_ROLES.includes(params.role)) {
      return { ok: false, error: "That isn't a role you can assign." };
    }

    const target = await prisma.user.findFirst({
      where: { id: params.userId, organizationId, role: { not: "PATIENT" } },
      select: { id: true, role: true, isActive: true },
    });
    if (!target) return { ok: false, error: "That staff member is no longer in this practice." };
    if (target.role === params.role) return { ok: true };

    // Demoting the last admin leaves nobody who can manage staff or
    // permissions, with no in-app way back.
    if (target.role === "ADMIN" && params.role !== "ADMIN" && target.isActive) {
      if ((await activeAdminCount(organizationId)) <= 1) {
        return { ok: false, error: "This is the only active admin. Promote someone else first." };
      }
    }

    await prisma.user.update({ where: { id: target.id }, data: { role: params.role } });

    await writeAuditLog({
      organizationId,
      actorUserId: session.user.id,
      action: "staff.role_changed",
      resourceType: "User",
      resourceId: target.id,
      metadata: { from: target.role, to: params.role },
    });

    revalidateAdmin(target.id);
    return { ok: true };
  } catch {
    return { ok: false, error: "Couldn't change that role. Please try again." };
  }
}

/**
 * Deactivates or reactivates an account — what "remove" means here.
 *
 * Nothing deletes. `User` is referenced by appointments, invoices,
 * documents, prescriptions and audit rows; a hard delete would either fail
 * on those restrict/set-null relations or scrub the practice's history of
 * who treated whom. `isActive: false` is already the app's offboarding
 * switch: `getCurrentSession` refuses an inactive account, so the person
 * loses access immediately while the record they're attached to survives.
 */
export async function setStaffActive(params: {
  userId: string;
  isActive: boolean;
}): Promise<StaffActionResult> {
  try {
    const session = await requirePermission("staff.manage");
    const organizationId = session.user.organizationId;

    if (params.userId === session.user.id && !params.isActive) {
      return { ok: false, error: "You can't deactivate your own account." };
    }

    const target = await prisma.user.findFirst({
      where: { id: params.userId, organizationId, role: { not: "PATIENT" } },
      select: { id: true, isActive: true, role: true },
    });
    if (!target) return { ok: false, error: "That staff member is no longer in this practice." };
    if (target.isActive === params.isActive) return { ok: true };

    if (!params.isActive && target.role === "ADMIN") {
      if ((await activeAdminCount(organizationId)) <= 1) {
        return { ok: false, error: "This is the only active admin. Promote someone else first." };
      }
    }

    await prisma.user.update({
      where: { id: target.id },
      data: { isActive: params.isActive, disabledAt: params.isActive ? null : new Date() },
    });

    // Signing out an offboarded account is the point of deactivating it —
    // `isActive` is checked on session read, but dropping the rows ends any
    // open session immediately rather than on its next request.
    if (!params.isActive) {
      await prisma.session.deleteMany({ where: { userId: target.id } });
    }

    await writeAuditLog({
      organizationId,
      actorUserId: session.user.id,
      action: params.isActive ? "staff.reactivated" : "staff.deactivated",
      resourceType: "User",
      resourceId: target.id,
      metadata: { isActive: params.isActive },
    });

    revalidateAdmin(target.id);
    return { ok: true };
  } catch {
    return { ok: false, error: "Couldn't update that account. Please try again." };
  }
}

/** Sets a new password for a staff member, for when someone is locked out. */
export async function resetStaffPassword(params: {
  userId: string;
  password: string;
}): Promise<StaffActionResult> {
  try {
    const session = await requirePermission("staff.manage");
    const organizationId = session.user.organizationId;

    if (params.password.length < 12) {
      return { ok: false, error: "Password must be at least 12 characters." };
    }

    const target = await prisma.user.findFirst({
      where: { id: params.userId, organizationId, role: { not: "PATIENT" } },
      select: { id: true },
    });
    if (!target) return { ok: false, error: "That staff member is no longer in this practice." };

    await prisma.user.update({
      where: { id: target.id },
      data: { passwordHash: await hashPassword(params.password) },
    });

    // Every existing session for that account is now stale: a password reset
    // is either offboarding-adjacent or a lockout, and both want anyone
    // already signed in as them pushed back to the login screen.
    await prisma.session.deleteMany({ where: { userId: target.id } });

    await writeAuditLog({
      organizationId,
      actorUserId: session.user.id,
      action: "staff.password_reset",
      resourceType: "User",
      resourceId: target.id,
      // No password material, not even its length.
      metadata: {},
    });

    revalidateAdmin(target.id);
    return { ok: true };
  } catch {
    return { ok: false, error: "Couldn't reset that password. Please try again." };
  }
}

/**
 * Sets one permission override for a staff member.
 *
 * `null` clears the override, returning them to whatever their role grants
 * by default — which is why the UI offers three states rather than a switch.
 * An explicit `true` that happens to match the role default still persists,
 * so the grant survives a later change to that role's defaults.
 */
export async function setStaffPermission(params: {
  userId: string;
  permission: PermissionKey;
  value: boolean | null;
}): Promise<StaffActionResult> {
  try {
    const session = await requirePermission("permissions.manage");
    const organizationId = session.user.organizationId;

    if (!(PERMISSION_KEYS as string[]).includes(params.permission)) {
      return { ok: false, error: "That isn't a permission you can set." };
    }

    const target = await prisma.user.findFirst({
      where: { id: params.userId, organizationId, role: { not: "PATIENT" } },
      select: { id: true, role: true, permissionOverrides: true },
    });
    if (!target) return { ok: false, error: "That staff member is no longer in this practice." };

    // Locking yourself out of permission management is unrecoverable in-app.
    if (
      params.userId === session.user.id &&
      params.permission === "permissions.manage" &&
      params.value === false
    ) {
      return { ok: false, error: "You can't remove your own permission management." };
    }

    const overrides = parseOverrides(target.permissionOverrides);
    if (params.value === null) {
      delete overrides[params.permission];
    } else {
      overrides[params.permission] = params.value;
    }

    await prisma.user.update({
      where: { id: target.id },
      data: {
        // `Prisma.DbNull` (a real SQL NULL), not `undefined` — undefined means
        // "leave this column alone", which would silently keep the last
        // override set when clearing the final one. Emptying the object back
        // to NULL keeps "no exceptions" identical to "never had any".
        permissionOverrides:
          Object.keys(overrides).length > 0 ? overrides : Prisma.DbNull,
      },
    });

    await writeAuditLog({
      organizationId,
      actorUserId: session.user.id,
      action: "staff.permission_changed",
      resourceType: "User",
      resourceId: target.id,
      metadata: { permission: params.permission, value: params.value },
    });

    revalidateAdmin(target.id);
    return { ok: true };
  } catch {
    return { ok: false, error: "Couldn't update that permission. Please try again." };
  }
}
