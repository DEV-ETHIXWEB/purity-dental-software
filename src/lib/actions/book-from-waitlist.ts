"use server";

import { requireRole } from "@/lib/auth/authorize";
import { createAppointment, hasOverlappingAppointment } from "@/lib/data/appointments";
import { getWaitlistEntryById, removeWaitlistEntry } from "@/lib/data/waitlist";
import { getProviderById } from "@/lib/data/providers";
import { writeAuditLog } from "@/lib/auth/audit-log";

export interface BookFromWaitlistResult {
  ok: boolean;
  error?: string;
}

/**
 * Books a waitlisted patient into the next open slot — backs the Schedule
 * board's "drag a waitlist entry onto the calendar" interaction (Figma flow:
 * Schedule/appointments → Waitlist drag n drop).
 *
 * `patientId` is deliberately NOT accepted from the caller: it's derived
 * from the org-scoped waitlist entry itself. Accepting it as a param would
 * let a crafted request book any organizationId-valid patient (not
 * necessarily the one actually on this waitlist entry) — see
 * `getWaitlistEntryById`. `providerId` likewise must be re-checked against
 * the org here since middleware/`requireRole` only proves who the *caller*
 * is, not that the clinician they're booking *into* belongs to the same
 * organization.
 */
export async function bookFromWaitlist(params: {
  waitlistEntryId: string;
  providerId: string;
  startTime: string;
  endTime: string;
}): Promise<BookFromWaitlistResult> {
  try {
    const session = await requireRole(["DENTIST", "HYGIENIST", "RECEPTIONIST", "ADMIN"]);

    const [entry, provider] = await Promise.all([
      getWaitlistEntryById(session.user.organizationId, params.waitlistEntryId),
      getProviderById(session.user.organizationId, params.providerId),
    ]);
    if (!entry) return { ok: false, error: "This waitlist entry no longer exists." };
    if (!provider) return { ok: false, error: "That provider is not available." };

    const startTime = new Date(params.startTime);
    const endTime = new Date(params.endTime);
    if (await hasOverlappingAppointment(session.user.organizationId, provider.id, startTime, endTime)) {
      return { ok: false, error: "That provider already has an appointment at this time." };
    }

    const appointment = await createAppointment({
      organizationId: session.user.organizationId,
      patientId: entry.patientId,
      providerId: provider.id,
      procedureType: "Open Slot Booking",
      startTime,
      endTime,
    });

    await removeWaitlistEntry(session.user.organizationId, params.waitlistEntryId);

    await writeAuditLog({
      organizationId: session.user.organizationId,
      actorUserId: session.user.id,
      action: "appointment.booked_from_waitlist",
      resourceType: "Appointment",
      resourceId: appointment.id,
    });

    return { ok: true };
  } catch {
    return { ok: false, error: "Couldn't book this slot. Please try again." };
  }
}
