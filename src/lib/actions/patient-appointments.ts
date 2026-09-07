"use server";

import { requireRole } from "@/lib/auth/authorize";
import { prisma } from "@/lib/prisma";
import { createAppointment, hasOverlappingAppointment } from "@/lib/data/appointments";
import { getProviderById } from "@/lib/data/providers";
import { getPatientForUser } from "@/lib/data/patients";
import { writeAuditLog } from "@/lib/auth/audit-log";

interface ActionResult {
  ok: boolean;
  error?: string;
}

/** Resolves the signed-in PATIENT-role user's own clinical Patient record, or throws. */
async function requireOwnPatientRecord(userId: string) {
  const patient = await getPatientForUser(userId);
  if (!patient) throw new Error("No patient record linked to this account.");
  return patient;
}

/** Patient-portal "book a visit" flow — creates a real Appointment for the signed-in patient. */
export async function bookPatientAppointment(params: {
  providerId: string;
  procedureType: string;
  startTime: string;
  endTime: string;
}): Promise<ActionResult> {
  try {
    const session = await requireRole(["PATIENT"]);
    const patient = await requireOwnPatientRecord(session.user.id);

    // Re-check providerId against the caller's own organization — it's
    // client-supplied (whichever dentist/hygienist the patient picked in the
    // booking flow) and `requireRole` only proves who the *patient* is, not
    // that the clinician they're booking belongs to the same organization.
    const provider = await getProviderById(session.user.organizationId, params.providerId);
    if (!provider) {
      return { ok: false, error: "That provider is not available." };
    }

    const startTime = new Date(params.startTime);
    const endTime = new Date(params.endTime);
    if (await hasOverlappingAppointment(session.user.organizationId, provider.id, startTime, endTime)) {
      return { ok: false, error: "That time is no longer available. Please pick another slot." };
    }

    const appointment = await createAppointment({
      organizationId: session.user.organizationId,
      patientId: patient.id,
      providerId: provider.id,
      procedureType: params.procedureType,
      startTime,
      endTime,
    });

    await writeAuditLog({
      organizationId: session.user.organizationId,
      actorUserId: session.user.id,
      action: "appointment.booked_by_patient",
      resourceType: "Appointment",
      resourceId: appointment.id,
    });

    return { ok: true };
  } catch {
    return { ok: false, error: "Couldn't book this appointment. Please try again." };
  }
}

/** Patient-portal "cancel" action — only lets a patient cancel their own appointment. */
export async function cancelPatientAppointment(appointmentId: string): Promise<ActionResult> {
  try {
    const session = await requireRole(["PATIENT"]);
    const patient = await requireOwnPatientRecord(session.user.id);

    const result = await prisma.appointment.updateMany({
      where: { id: appointmentId, organizationId: session.user.organizationId, patientId: patient.id },
      data: { status: "CANCELLED" },
    });
    if (result.count === 0) {
      return { ok: false, error: "Appointment not found." };
    }

    await writeAuditLog({
      organizationId: session.user.organizationId,
      actorUserId: session.user.id,
      action: "appointment.cancelled_by_patient",
      resourceType: "Appointment",
      resourceId: appointmentId,
    });

    return { ok: true };
  } catch {
    return { ok: false, error: "Couldn't cancel this appointment. Please try again." };
  }
}
