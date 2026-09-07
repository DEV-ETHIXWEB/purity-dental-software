import "server-only";
import { prisma } from "@/lib/prisma";
import type { Appointment, Patient, User } from "@/generated/prisma/client";

/**
 * Real Prisma-backed appointment queries — replaces the fixed 2026-08-24
 * fixture week previously hardcoded in `src/lib/sample-data.ts`. "Today" and
 * "this week" here are the real server clock, not a frozen demo date, since
 * this is the data layer a production deploy actually runs on.
 *
 * Every query includes the related `patient` directly rather than making
 * callers build a separate id→patient lookup map — several consumers
 * (AppointmentListItem, ScheduleDayView, ScheduleBoard's drag-and-drop) are
 * Client Components that can't make their own async Prisma call, so the
 * resolved patient has to already be on the object by the time it crosses
 * the server→client boundary.
 */

export type AppointmentWithPatient = Appointment & { patient: Patient };
/** Practice-wide (Receptionist) views additionally need the provider's name — every provider, not just one. */
export type AppointmentWithPatientAndProvider = Appointment & { patient: Patient; provider: User };

function startOfDay(d: Date): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function endOfDay(d: Date): Date {
  const x = new Date(d);
  x.setHours(23, 59, 59, 999);
  return x;
}

/** Monday of the week containing `d` (ISO week, not US Sunday-start). */
function startOfWeek(d: Date): Date {
  const x = startOfDay(d);
  const day = x.getDay(); // 0 = Sunday
  const diff = day === 0 ? -6 : 1 - day;
  x.setDate(x.getDate() + diff);
  return x;
}

export async function appointmentsForProvider(
  organizationId: string,
  providerId: string,
): Promise<AppointmentWithPatient[]> {
  return prisma.appointment.findMany({
    where: { organizationId, providerId },
    include: { patient: true },
    orderBy: { startTime: "asc" },
  });
}

export async function todaysAppointmentsForProvider(
  organizationId: string,
  providerId: string,
): Promise<AppointmentWithPatient[]> {
  const now = new Date();
  return prisma.appointment.findMany({
    where: {
      organizationId,
      providerId,
      startTime: { gte: startOfDay(now), lte: endOfDay(now) },
    },
    include: { patient: true },
    orderBy: { startTime: "asc" },
  });
}

/** All appointments for a single patient, most recent first — Receptionist's patient-profile appointment history tab. */
export async function appointmentsForPatient(
  organizationId: string,
  patientId: string,
): Promise<AppointmentWithPatientAndProvider[]> {
  return prisma.appointment.findMany({
    where: { organizationId, patientId },
    include: { patient: true, provider: true },
    orderBy: { startTime: "desc" },
  });
}

export async function practiceAppointments(organizationId: string): Promise<AppointmentWithPatientAndProvider[]> {
  return prisma.appointment.findMany({
    where: { organizationId },
    include: { patient: true, provider: true },
    orderBy: { startTime: "asc" },
  });
}

export async function todaysPracticeAppointments(organizationId: string): Promise<AppointmentWithPatientAndProvider[]> {
  const now = new Date();
  return prisma.appointment.findMany({
    where: {
      organizationId,
      startTime: { gte: startOfDay(now), lte: endOfDay(now) },
    },
    include: { patient: true, provider: true },
    orderBy: { startTime: "asc" },
  });
}

/**
 * Whether `providerId` already has a non-cancelled appointment overlapping
 * [startTime, endTime) — guards against silently double-booking a
 * clinician. Two ranges overlap iff each starts before the other ends.
 */
export async function hasOverlappingAppointment(
  organizationId: string,
  providerId: string,
  startTime: Date,
  endTime: Date,
): Promise<boolean> {
  const conflict = await prisma.appointment.findFirst({
    where: {
      organizationId,
      providerId,
      status: { not: "CANCELLED" },
      startTime: { lt: endTime },
      endTime: { gt: startTime },
    },
    select: { id: true },
  });
  return conflict !== null;
}

/**
 * Create a real Appointment row — backs the Schedule board's waitlist
 * drag-and-drop ("drop a patient onto the next open slot") and the Patient
 * portal's booking flow, replacing their previous client-state-only mutation.
 */
export async function createAppointment(params: {
  organizationId: string;
  patientId: string;
  providerId: string;
  procedureType: string;
  startTime: Date;
  endTime: Date;
}): Promise<AppointmentWithPatient> {
  return prisma.appointment.create({
    data: {
      organizationId: params.organizationId,
      patientId: params.patientId,
      providerId: params.providerId,
      procedureType: params.procedureType,
      startTime: params.startTime,
      endTime: params.endTime,
    },
    include: { patient: true },
  });
}

export interface TodaysVisitBreakdown {
  total: number;
  newCount: number;
  returningCount: number;
  /**
   * % of this provider's completed appointments in the last 30 days that
   * were `completedOnTime`. There's no real check-in/arrival timestamp
   * captured anywhere in the app yet (see the schema comment on
   * `Appointment.completedOnTime`), so this is only as accurate as that
   * best-effort field — a real DB aggregate, not a hardcoded UI number, but
   * not a precise punctuality measurement either. Null when there's no
   * completed-appointment data in the window to compute a rate from.
   */
  onTimePct: number | null;
}

/**
 * Today's appointment count for one provider, split into new vs. returning
 * patients (a patient counts as "new" if this is the earliest appointment
 * on record for them in the org), plus a rolling on-time rate. Backs the
 * Dashboard's "Today's visits" ring + New/Returning legend.
 */
export async function todaysVisitBreakdown(
  organizationId: string,
  providerId: string,
): Promise<TodaysVisitBreakdown> {
  const now = new Date();

  const today = await prisma.appointment.findMany({
    where: {
      organizationId,
      providerId,
      status: { not: "CANCELLED" },
      startTime: { gte: startOfDay(now), lte: endOfDay(now) },
    },
    select: { patientId: true, startTime: true },
  });

  let newCount = 0;
  if (today.length > 0) {
    const patientIds = [...new Set(today.map((a) => a.patientId))];
    const earliestByPatient = await prisma.appointment.groupBy({
      by: ["patientId"],
      where: { organizationId, patientId: { in: patientIds } },
      _min: { startTime: true },
    });
    const earliestMap = new Map(earliestByPatient.map((e) => [e.patientId, e._min.startTime!.getTime()]));
    for (const appt of today) {
      if (appt.startTime.getTime() <= (earliestMap.get(appt.patientId) ?? Infinity)) newCount++;
    }
  }

  const thirtyDaysAgo = new Date(now);
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const [onTimeCount, trackedCount] = await Promise.all([
    prisma.appointment.count({
      where: {
        organizationId,
        providerId,
        status: "COMPLETED",
        completedOnTime: true,
        startTime: { gte: thirtyDaysAgo, lte: now },
      },
    }),
    prisma.appointment.count({
      where: {
        organizationId,
        providerId,
        status: "COMPLETED",
        completedOnTime: { not: null },
        startTime: { gte: thirtyDaysAgo, lte: now },
      },
    }),
  ]);

  return {
    total: today.length,
    newCount,
    returningCount: today.length - newCount,
    onTimePct: trackedCount > 0 ? Math.round((onTimeCount / trackedCount) * 100) : null,
  };
}

/** Mon–Sun visit counts for the current week, scoped to one provider (Dentist/Hygienist dashboards). */
export async function weeklyVisitCounts(
  organizationId: string,
  providerId: string,
): Promise<{ day: string; count: number }[]> {
  const monday = startOfWeek(new Date());
  const sunday = new Date(monday);
  sunday.setDate(sunday.getDate() + 7);

  const weekAppointments = await prisma.appointment.findMany({
    where: {
      organizationId,
      providerId,
      startTime: { gte: monday, lt: sunday },
    },
    select: { startTime: true },
  });

  const labels = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const counts = new Array(7).fill(0);
  for (const appt of weekAppointments) {
    const dayIndex = Math.floor((startOfDay(appt.startTime).getTime() - monday.getTime()) / 86_400_000);
    if (dayIndex >= 0 && dayIndex < 7) counts[dayIndex]++;
  }
  return labels.map((day, i) => ({ day, count: counts[i] }));
}
