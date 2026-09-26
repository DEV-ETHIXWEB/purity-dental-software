import "server-only";
import {
  RECALL_REMINDER_ACTION,
  RECALL_REMINDER_COOLDOWN_MS,
} from "@/lib/recall-reminder";
import { prisma } from "@/lib/prisma";
import type { Patient, UserRole } from "@/generated/prisma/client";

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
async function withDerivedVisitDates<T extends Patient>(
  organizationId: string,
  patients: T[],
): Promise<T[]> {
  if (patients.length === 0) return patients;

  const patientIds = patients.map((p) => p.id);

  const [upcoming, lastVisits] = await Promise.all([
    prisma.appointment.groupBy({
      by: ["patientId"],
      where: {
        organizationId,
        patientId: { in: patientIds },
        startTime: { gte: new Date() },
        status: { notIn: ["CANCELLED", "NO_SHOW"] },
      },
      _min: { startTime: true },
    }),
    /*
     * `lastCleaningAt` drifted the same way `nextApptAt` did, and showed it
     * more plainly: the dashboard printed "Last cleaning: Mar 21, 2026"
     * directly above "Cleaning completed on Aug 20, 2026" — the snapshot and
     * the appointment table disagreeing inside one card. Overlaid from the
     * most recent COMPLETED visit for the same reason as above.
     */
    prisma.appointment.groupBy({
      by: ["patientId"],
      where: {
        organizationId,
        patientId: { in: patientIds },
        status: "COMPLETED",
      },
      _max: { startTime: true },
    }),
  ]);

  const nextByPatient = new Map(upcoming.map((row) => [row.patientId, row._min.startTime]));
  const lastByPatient = new Map(lastVisits.map((row) => [row.patientId, row._max.startTime]));

  return patients.map((p) => ({
    ...p,
    nextApptAt: nextByPatient.get(p.id) ?? null,
    lastCleaningAt: lastByPatient.get(p.id) ?? null,
  }));
}

export async function listPatients(organizationId: string): Promise<Patient[]> {
  const patients = await prisma.patient.findMany({
    where: { organizationId },
    orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
  });
  return withDerivedVisitDates(organizationId, patients);
}

/** Scoped by organizationId so one tenant can never fetch another tenant's patient by guessing an id. */
export async function getPatientById(organizationId: string, id: string): Promise<Patient | null> {
  const patient = await prisma.patient.findFirst({ where: { id, organizationId } });
  if (!patient) return null;
  const [withNext] = await withDerivedVisitDates(organizationId, [patient]);
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

/**
 * Which of these patients have had a recall reminder inside the cooldown.
 *
 * Read from the audit trail rather than the message thread: the audit row is
 * what `sendRecallReminder` de-duplicates against, so reading the same
 * source keeps the button's initial state and the server's answer in
 * agreement. Matching on message text would drift the moment the wording
 * changes.
 */
export async function recentlyRemindedPatientIds(
  organizationId: string,
  patientIds: string[],
): Promise<Set<string>> {
  if (patientIds.length === 0) return new Set();
  const rows = await prisma.auditLog.findMany({
    where: {
      organizationId,
      action: RECALL_REMINDER_ACTION,
      resourceId: { in: patientIds },
      createdAt: { gte: new Date(Date.now() - RECALL_REMINDER_COOLDOWN_MS) },
    },
    select: { resourceId: true },
  });
  return new Set(rows.map((r) => r.resourceId));
}

/** The clinician a patient is currently under, and how that was decided. */
export interface AssignedProvider {
  id: string;
  name: string;
  role: UserRole;
}

/**
 * Who each patient is currently seeing, keyed by patient id.
 *
 * There is no `Patient.providerId` column — a patient isn't formally assigned
 * to a clinician anywhere in the schema — so this derives it the same way the
 * Patient portal's "your care team" does: whoever treated them most recently.
 * Deriving it means it can't go stale the way a denormalised column would
 * (see `withDerivedVisitDates` above for what that looked like).
 *
 * `distinct` on `patientId` with a descending sort gives Prisma the latest
 * appointment per patient in one query rather than one per patient.
 */
export async function assignedProviders(
  organizationId: string,
  patientIds: string[],
): Promise<Map<string, AssignedProvider>> {
  if (patientIds.length === 0) return new Map();

  const latest = await prisma.appointment.findMany({
    where: { organizationId, patientId: { in: patientIds }, status: { not: "CANCELLED" } },
    distinct: ["patientId"],
    orderBy: [{ patientId: "asc" }, { startTime: "desc" }],
    select: {
      patientId: true,
      provider: { select: { id: true, name: true, role: true } },
    },
  });

  return new Map(
    latest.map((row) => [
      row.patientId,
      { id: row.provider.id, name: row.provider.name, role: row.provider.role },
    ]),
  );
}
