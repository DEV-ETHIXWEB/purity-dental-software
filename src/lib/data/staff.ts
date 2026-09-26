import "server-only";
import { prisma } from "@/lib/prisma";
import type { UserRole } from "@/generated/prisma/client";
import type { StaffMember } from "@/lib/staff-format";

// Labels and the row shape live in `staff-format` so Client Components can
// import them without pulling this server-only module into the browser.
export { STAFF_ROLES, ROLE_LABELS } from "@/lib/staff-format";
export type { StaffMember } from "@/lib/staff-format";


/**
 * Staff directory reads for the Admin portal.
 *
 * Every projection here is an explicit `select`. `User` holds `passwordHash`
 * and `photoData`, and a bare `findMany()` would pull both into a payload
 * headed for a client component — the select list is the guard.
 */

const STAFF_SELECT = {
  id: true,
  name: true,
  email: true,
  phone: true,
  role: true,
  avatarUrl: true,
  isActive: true,
  disabledAt: true,
  createdAt: true,
  permissionOverrides: true,
} as const;

/**
 * Everyone in the practice who isn't a patient, deactivated accounts
 * included — an admin managing staff needs to see who was offboarded in
 * order to reactivate them, so filtering here would hide the only route
 * back.
 */
export async function listStaff(organizationId: string): Promise<StaffMember[]> {
  return prisma.user.findMany({
    where: { organizationId, role: { not: "PATIENT" } },
    select: STAFF_SELECT,
    orderBy: [{ isActive: "desc" }, { name: "asc" }],
  });
}

export async function getStaffMember(
  organizationId: string,
  userId: string,
): Promise<StaffMember | null> {
  return prisma.user.findFirst({
    where: { id: userId, organizationId, role: { not: "PATIENT" } },
    select: STAFF_SELECT,
  });
}

/** Headcount per role, for the admin dashboard. Active accounts only. */
export async function staffCountsByRole(
  organizationId: string,
): Promise<Record<UserRole, number>> {
  const rows = await prisma.user.groupBy({
    by: ["role"],
    where: { organizationId, isActive: true, role: { not: "PATIENT" } },
    _count: { _all: true },
  });

  const counts = {
    ADMIN: 0,
    DENTIST: 0,
    HYGIENIST: 0,
    RECEPTIONIST: 0,
    PATIENT: 0,
  } as Record<UserRole, number>;
  for (const row of rows) counts[row.role] = row._count._all;
  return counts;
}

/**
 * How many active admins the practice has.
 *
 * Used to stop the last one being deactivated or demoted — an organization
 * with no admin has nobody who can manage staff or permissions, and no
 * in-app way to recover.
 */
export async function activeAdminCount(organizationId: string): Promise<number> {
  return prisma.user.count({
    where: { organizationId, role: "ADMIN", isActive: true },
  });
}
