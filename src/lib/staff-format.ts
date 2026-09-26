import type { UserRole } from "@/generated/prisma/client";

/**
 * Staff shapes and labels shared by server and client.
 *
 * Split out of `src/lib/data/staff.ts` because that module is `server-only`:
 * the admin tables and forms are Client Components, and importing the role
 * labels from there dragged Prisma (and its `dns`/`net` dependencies) into
 * the browser bundle. Same split as `patient-format.ts` and
 * `billing-format.ts`.
 */

/** Staff roles, in the order the Admin portal lists and groups them. */
export const STAFF_ROLES: readonly UserRole[] = ["ADMIN", "DENTIST", "HYGIENIST", "RECEPTIONIST"];

export const ROLE_LABELS: Record<UserRole, string> = {
  ADMIN: "Admin",
  DENTIST: "Dentist",
  HYGIENIST: "Hygienist",
  RECEPTIONIST: "Receptionist",
  PATIENT: "Patient",
};

export interface StaffMember {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  role: UserRole;
  avatarUrl: string | null;
  isActive: boolean;
  disabledAt: Date | null;
  createdAt: Date;
  permissionOverrides: unknown;
}
