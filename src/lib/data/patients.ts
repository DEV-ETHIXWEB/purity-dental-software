import "server-only";
import { prisma } from "@/lib/prisma";
import type { Patient } from "@/generated/prisma/client";

/**
 * Real Prisma-backed patient queries — replaces the hardcoded roster
 * previously in `src/lib/sample-data.ts`. Every read is scoped by
 * `organizationId` (multi-tenant isolation — see `assertSameOrganization` in
 * `src/lib/auth/authorize.ts`); callers must resolve that from
 * `requireSession()`/`requireRole()` first, never accept it from a client.
 *
 * Pure formatting helpers (patientFullName, patientAge) live in
 * `@/lib/patient-format` instead of here — this module is `"server-only"`,
 * which would make those unusable from Client Components too.
 */

export async function listPatients(organizationId: string): Promise<Patient[]> {
  return prisma.patient.findMany({
    where: { organizationId },
    orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
  });
}

/** Scoped by organizationId so one tenant can never fetch another tenant's patient by guessing an id. */
export async function getPatientById(organizationId: string, id: string): Promise<Patient | null> {
  return prisma.patient.findFirst({ where: { id, organizationId } });
}

/** Resolves a signed-in PATIENT-role user's own clinical Patient record — the Patient portal's identity source. */
export async function getPatientForUser(userId: string): Promise<Patient | null> {
  return prisma.patient.findUnique({ where: { userId } });
}

/**
 * Patients needing follow-up: anyone whose `recallStatus` isn't "on track" —
 * i.e. overdue or due-soon recalls. Derived from the same `recallStatus`
 * snapshot field already shown elsewhere (patient cards, recall badges)
 * rather than a separate follow-ups table, so there's exactly one source of
 * truth for "does this patient need outreach."
 */
export async function listFollowUps(organizationId: string, limit = 5): Promise<Patient[]> {
  return prisma.patient.findMany({
    where: {
      organizationId,
      recallStatus: { not: null, notIn: ["On track"] },
    },
    orderBy: { nextApptAt: "asc" },
    take: limit,
  });
}
