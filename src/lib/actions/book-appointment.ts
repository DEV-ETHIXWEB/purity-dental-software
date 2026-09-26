"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth/authorize";
import { createAppointment, hasOverlappingAppointment } from "@/lib/data/appointments";
import { getPatientById } from "@/lib/data/patients";
import { getProviderById } from "@/lib/data/providers";
import { writeAuditLog } from "@/lib/auth/audit-log";

export interface BookAppointmentResult {
  ok: boolean;
  error?: string;
  appointmentId?: string;
}


/**
 * Books a visit from a staff portal — the Dentist and Hygienist schedules and
 * the Receptionist's practice board.
 *
 * Until this existed, every staff-side "New Appointment" / "Book Appointment"
 * button was a link to a read-only day board: the front desk, whose whole job
 * is booking, could not create an appointment at all. Only the patient portal
 * could.
 *
 * Both `patientId` and `providerId` are re-read against the caller's own
 * organization before anything is written. `requireRole` proves who is asking,
 * not that the patient and clinician they named belong to the same practice —
 * without this, a crafted request could attach a visit to another tenant's
 * records. Same reasoning as `bookFromWaitlist`.
 */
export async function bookAppointment(params: {
  patientId: string;
  providerId: string;
  /** ISO instant. The client builds it from the practice-local date/time the user picked. */
  startTime: string;
  /** Chair time in minutes; clamped to something a real appointment could be. */
  durationMinutes: number;
  procedureType: string;
  notes?: string;
}): Promise<BookAppointmentResult> {
  try {
    const session = await requireRole(["DENTIST", "HYGIENIST", "RECEPTIONIST", "ADMIN"]);
    const organizationId = session.user.organizationId;

    const [patient, provider] = await Promise.all([
      getPatientById(organizationId, params.patientId),
      getProviderById(organizationId, params.providerId),
    ]);
    if (!patient) return { ok: false, error: "That patient is not in this practice." };
    if (!provider) return { ok: false, error: "That provider is not available." };

    const procedureType = params.procedureType.trim();
    if (!procedureType) return { ok: false, error: "Pick what the visit is for." };

    const startTime = new Date(params.startTime);
    if (Number.isNaN(startTime.getTime())) {
      return { ok: false, error: "That date and time isn't valid." };
    }

    const minutes = Math.round(params.durationMinutes);
    if (!Number.isFinite(minutes) || minutes < 5 || minutes > 480) {
      return { ok: false, error: "Choose a length between 5 minutes and 8 hours." };
    }
    const endTime = new Date(startTime.getTime() + minutes * 60_000);

    if (await hasOverlappingAppointment(organizationId, provider.id, startTime, endTime)) {
      return { ok: false, error: `${provider.name} already has an appointment at that time.` };
    }

    const appointment = await createAppointment({
      organizationId,
      patientId: patient.id,
      providerId: provider.id,
      procedureType,
      startTime,
      endTime,
    });

    await writeAuditLog({
      organizationId,
      actorUserId: session.user.id,
      action: "appointment.booked",
      resourceType: "Appointment",
      resourceId: appointment.id,
      metadata: { providerId: provider.id, patientId: patient.id, procedureType },
    });

    // Every staff surface that counts or lists appointments.
    for (const path of [
      "/schedule",
      "/dashboard",
      "/hygienist/schedule",
      "/hygienist/dashboard",
      "/receptionist/schedule",
      "/receptionist/dashboard",
    ]) {
      revalidatePath(path);
    }

    return { ok: true, appointmentId: appointment.id };
  } catch {
    return { ok: false, error: "Couldn't book this appointment. Please try again." };
  }
}
