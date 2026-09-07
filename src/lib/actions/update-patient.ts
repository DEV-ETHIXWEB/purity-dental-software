"use server";

import { requireRole } from "@/lib/auth/authorize";
import { prisma } from "@/lib/prisma";
import { getPatientById } from "@/lib/data/patients";
import { writeAuditLog } from "@/lib/auth/audit-log";

/**
 * Patient-record field-group permissions, per the Figma "Purity Research"
 * flow diagram's explicit legend on the Hygienist/Dentist → Patients →
 * "Overview of data of patient" node:
 *   - Demographics / Medical history / Treatment plan: Dentist & Hygienist
 *     VIEW ONLY; Receptionist inputs this data.
 *   - Docs & prescriptions, Billing details (insurance/payment), Contact:
 *     all three staff roles can enter/edit.
 * Enforced here server-side (never UI-only) via `requireRole` — the UI also
 * hides the edit affordance for roles that can't use it, but that's a
 * courtesy, not the security boundary.
 */

interface ActionResult {
  ok: boolean;
  error?: string;
}

export async function updatePatientContact(
  patientId: string,
  data: { phone: string; email: string },
): Promise<ActionResult> {
  try {
    const session = await requireRole(["DENTIST", "HYGIENIST", "RECEPTIONIST", "ADMIN"]);
    const patient = await getPatientById(session.user.organizationId, patientId);
    if (!patient) return { ok: false, error: "Patient not found." };

    await prisma.patient.update({
      where: { id: patientId },
      data: { phone: data.phone, email: data.email },
    });
    await writeAuditLog({
      organizationId: session.user.organizationId,
      actorUserId: session.user.id,
      action: "patient.contact_updated",
      resourceType: "Patient",
      resourceId: patientId,
    });
    return { ok: true };
  } catch {
    return { ok: false, error: "Couldn't save contact details. Please try again." };
  }
}

export async function updatePatientBilling(
  patientId: string,
  data: { insuranceProvider: string; insurancePlan: string },
): Promise<ActionResult> {
  try {
    const session = await requireRole(["DENTIST", "HYGIENIST", "RECEPTIONIST", "ADMIN"]);
    const patient = await getPatientById(session.user.organizationId, patientId);
    if (!patient) return { ok: false, error: "Patient not found." };

    await prisma.patient.update({
      where: { id: patientId },
      data: { insuranceProvider: data.insuranceProvider, insurancePlan: data.insurancePlan },
    });
    await writeAuditLog({
      organizationId: session.user.organizationId,
      actorUserId: session.user.id,
      action: "patient.billing_updated",
      resourceType: "Patient",
      resourceId: patientId,
    });
    return { ok: true };
  } catch {
    return { ok: false, error: "Couldn't save billing details. Please try again." };
  }
}

/** Demographics/medical history — Receptionist/Admin only; Dentist/Hygienist are view-only per the Figma flow. */
export async function updatePatientDemographics(
  patientId: string,
  data: { firstName: string; lastName: string; phone: string },
): Promise<ActionResult> {
  try {
    const session = await requireRole(["RECEPTIONIST", "ADMIN"]);
    const patient = await getPatientById(session.user.organizationId, patientId);
    if (!patient) return { ok: false, error: "Patient not found." };

    await prisma.patient.update({
      where: { id: patientId },
      data: { firstName: data.firstName, lastName: data.lastName, phone: data.phone },
    });
    await writeAuditLog({
      organizationId: session.user.organizationId,
      actorUserId: session.user.id,
      action: "patient.demographics_updated",
      resourceType: "Patient",
      resourceId: patientId,
    });
    return { ok: true };
  } catch {
    return { ok: false, error: "Couldn't save demographics. Please try again." };
  }
}
