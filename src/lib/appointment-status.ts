import type { AppointmentStatus } from "@/generated/prisma/client";

/**
 * Appointment lifecycle helpers shared by the staff portals.
 *
 * Nothing in this app ever moved a booking out of its scheduled state. A visit
 * booked for last month still read "Scheduled" weeks later, two patients had
 * been sitting in "Checked In" since August, and the dashboards' completed /
 * on-time / revenue figures counted almost nothing because only one row in the
 * whole practice had ever reached COMPLETED.
 *
 * The fix is deliberately *not* a job that flips past bookings to NO_SHOW on a
 * timer. Whether a patient actually turned up is a clinical fact the software
 * doesn't know, and inventing it would put wrong history on a medical record.
 * Instead a past-but-unresolved visit is surfaced as "Needs attention", and a
 * human closes it out with `resolveAppointment`.
 */

/** Statuses that still expect something to happen. A past visit in one of these is unresolved. */
const OPEN_STATUSES: readonly AppointmentStatus[] = [
  "SCHEDULED",
  "CONFIRMED",
  "CHECKED_IN",
  "IN_PROGRESS",
];

/** The two ways a visit can be closed out once its time has passed. */
export type AppointmentOutcome = Extract<AppointmentStatus, "COMPLETED" | "NO_SHOW">;

export const OUTCOME_LABEL: Record<AppointmentOutcome, string> = {
  COMPLETED: "Completed",
  NO_SHOW: "No show",
};

/**
 * A booking whose time has passed while it was still waiting on something.
 * Reads `endTime`, not `startTime` — a visit that is merely running late
 * hasn't been missed yet.
 */
export function isUnresolvedPastVisit(
  appointment: { status: AppointmentStatus; endTime: Date },
  now: Date = new Date(),
): boolean {
  return OPEN_STATUSES.includes(appointment.status) && appointment.endTime.getTime() < now.getTime();
}

/**
 * What to show on a badge for this appointment. Identical to the stored status
 * except for the unresolved-past case, which every staff surface should call
 * out rather than quietly presenting as an ordinary future booking.
 */
export function displayStatusLabel(
  appointment: { status: AppointmentStatus; endTime: Date },
  statusLabels: Record<AppointmentStatus, string>,
  now: Date = new Date(),
): string {
  return isUnresolvedPastVisit(appointment, now) ? "Missed" : statusLabels[appointment.status];
}
