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

/**
 * `Patient.nextApptAt` is a denormalized snapshot that nothing recomputes
 * when an appointment is booked, moved, or cancelled — so it drifts, and the
 * drift is always the embarrassing direction: a patient who booked a new
 * visit still showed "Next appointment: Aug 27, 2026", a date in the past.
 *
 * Rather than add a write-path update to every one of the (currently six)
 * places that touch an Appointment — where the next one added would quietly
 * reintroduce the bug — the column is overlaid at read time with the real
 * earliest upcoming appointment. Derived state can't go stale.
 */
async function withDerivedNextAppt<T extends Patient>(
  organizationId: string,
  patients: T[],
): Promise<T[]> {
  if (patients.length === 0) return patients;

  const upcoming = await prisma.appointment.groupBy({
    by: ["patientId"],
    where: {
      organizationId,
      patientId: { in: patients.map((p) => p.id) },
      startTime: { gte: new Date() },
      status: { notIn: ["CANCELLED", "NO_SHOW"] },
    },
    _min: { startTime: true },
  });

  const nextByPatient = new Map(upcoming.map((row) => [row.patientId, row._min.startTime]));
  return patients.map((p) => ({ ...p, nextApptAt: nextByPatient.get(p.id) ?? null }));
}

export async function listPatients(organizationId: string): Promise<Patient[]> {
  const patients = await prisma.patient.findMany({
    where: { organizationId },
    orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
  });
  return withDerivedNextAppt(organizationId, patients);
}

/** Scoped by organizationId so one tenant can never fetch another tenant's patient by guessing an id. */
export async function getPatientById(organizationId: string, id: string): Promise<Patient | null> {
  const patient = await prisma.patient.findFirst({ where: { id, organizationId } });
  if (!patient) return null;
  const [withNext] = await withDerivedNextAppt(organizationId, [patient]);
  return withNext;
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
