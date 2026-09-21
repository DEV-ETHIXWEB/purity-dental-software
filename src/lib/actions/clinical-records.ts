"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth/authorize";
import { prisma } from "@/lib/prisma";
import { getPatientById, getPatientForUser } from "@/lib/data/patients";
import { writeAuditLog } from "@/lib/auth/audit-log";
import type { DocumentKind } from "@/generated/prisma/client";

/**
 * Writes for patient documents, prescriptions and consent forms.
 *
 * Permissions follow the same legend as `update-patient.ts`: docs and
 * prescriptions are a field group all three staff roles can enter, so
 * Dentist / Hygienist / Receptionist all pass. Signing a consent form is the
 * patient's own act and is restricted to the PATIENT role, checked against
 * their own record — never a patientId supplied by the caller.
 */

interface ActionResult {
  ok: boolean;
  error?: string;
}

const STAFF = ["DENTIST", "HYGIENIST", "RECEPTIONIST", "ADMIN"] as const;

/**
 * Bytes live in Postgres (no blob store is configured), so the cap is what
 * keeps the table sane. 5MB comfortably holds a compressed bitewing or a
 * multi-page PDF report.
 */
const MAX_BYTES = 5 * 1024 * 1024;

const ALLOWED_TYPES = new Set([
  "image/png",
  "image/jpeg",
  "image/webp",
  "application/pdf",
]);

const DOCUMENT_KINDS = new Set<DocumentKind>(["XRAY", "REPORT", "REFERRAL", "OTHER"]);

/** Revalidate every portal's view of this patient — staff and patient alike. */
function revalidatePatient(patientId: string) {
  revalidatePath(`/patients/${patientId}`);
  revalidatePath(`/hygienist/patients/${patientId}`);
  revalidatePath(`/receptionist/patients/${patientId}`);
  revalidatePath("/patient/care");
}

export async function uploadPatientDocument(formData: FormData): Promise<ActionResult> {
  try {
    const session = await requireRole([...STAFF]);
    const patientId = String(formData.get("patientId") ?? "");
    const title = String(formData.get("title") ?? "").trim();
    const kindRaw = String(formData.get("kind") ?? "OTHER") as DocumentKind;
    const file = formData.get("file");

    const patient = await getPatientById(session.user.organizationId, patientId);
    if (!patient) return { ok: false, error: "Patient not found." };
    if (!title) return { ok: false, error: "Give the document a title." };
    if (!(file instanceof File) || file.size === 0) return { ok: false, error: "Choose a file to upload." };
    if (file.size > MAX_BYTES) {
      return { ok: false, error: `That file is ${(file.size / 1024 / 1024).toFixed(1)}MB — the limit is 5MB.` };
    }
    if (!ALLOWED_TYPES.has(file.type)) {
      return { ok: false, error: "Upload a PNG, JPEG, WebP or PDF." };
    }

    const kind = DOCUMENT_KINDS.has(kindRaw) ? kindRaw : "OTHER";
    const bytes = Buffer.from(await file.arrayBuffer());

    const created = await prisma.document.create({
      data: {
        organizationId: session.user.organizationId,
        patientId,
        kind,
        title,
        fileName: file.name,
        mimeType: file.type,
        sizeBytes: file.size,
        data: bytes,
        uploadedById: session.user.id,
      },
      select: { id: true },
    });

    await writeAuditLog({
      organizationId: session.user.organizationId,
      actorUserId: session.user.id,
      action: "document.upload",
      resourceType: "Document",
      resourceId: created.id,
      metadata: { patientId, kind, sizeBytes: file.size },
    });

    revalidatePatient(patientId);
    return { ok: true };
  } catch {
    return { ok: false, error: "Couldn't upload that document. Please try again." };
  }
}

export async function deletePatientDocument(documentId: string): Promise<ActionResult> {
  try {
    const session = await requireRole([...STAFF]);
    const existing = await prisma.document.findFirst({
      where: { id: documentId, organizationId: session.user.organizationId },
      select: { id: true, patientId: true, title: true },
    });
    if (!existing) return { ok: false, error: "Document not found." };

    await prisma.document.delete({ where: { id: existing.id } });
    await writeAuditLog({
      organizationId: session.user.organizationId,
      actorUserId: session.user.id,
      action: "document.delete",
      resourceType: "Document",
      resourceId: existing.id,
      metadata: { patientId: existing.patientId, title: existing.title },
    });

    revalidatePatient(existing.patientId);
    return { ok: true };
  } catch {
    return { ok: false, error: "Couldn't remove that document. Please try again." };
  }
}

export async function addPrescription(input: {
  patientId: string;
  medication: string;
  dosage: string;
  quantity?: string;
  instructions?: string;
}): Promise<ActionResult> {
  try {
    const session = await requireRole([...STAFF]);
    const patient = await getPatientById(session.user.organizationId, input.patientId);
    if (!patient) return { ok: false, error: "Patient not found." };

    const medication = input.medication.trim();
    const dosage = input.dosage.trim();
    if (!medication) return { ok: false, error: "Enter the medication or product." };
    if (!dosage) return { ok: false, error: "Enter a dosage." };

    const created = await prisma.prescription.create({
      data: {
        organizationId: session.user.organizationId,
        patientId: input.patientId,
        prescriberId: session.user.id,
        medication,
        dosage,
        quantity: input.quantity?.trim() || null,
        instructions: input.instructions?.trim() || null,
      },
      select: { id: true },
    });

    await writeAuditLog({
      organizationId: session.user.organizationId,
      actorUserId: session.user.id,
      action: "prescription.create",
      resourceType: "Prescription",
      resourceId: created.id,
      metadata: { patientId: input.patientId, medication },
    });

    revalidatePatient(input.patientId);
    return { ok: true };
  } catch {
    return { ok: false, error: "Couldn't save that prescription. Please try again." };
  }
}

export async function setPrescriptionStatus(
  prescriptionId: string,
  status: "ACTIVE" | "COMPLETED" | "CANCELLED",
): Promise<ActionResult> {
  try {
    const session = await requireRole([...STAFF]);
    const existing = await prisma.prescription.findFirst({
      where: { id: prescriptionId, organizationId: session.user.organizationId },
      select: { id: true, patientId: true },
    });
    if (!existing) return { ok: false, error: "Prescription not found." };

    await prisma.prescription.update({ where: { id: existing.id }, data: { status } });
    await writeAuditLog({
      organizationId: session.user.organizationId,
      actorUserId: session.user.id,
      action: "prescription.status",
      resourceType: "Prescription",
      resourceId: existing.id,
      metadata: { patientId: existing.patientId, status },
    });

    revalidatePatient(existing.patientId);
    return { ok: true };
  } catch {
    return { ok: false, error: "Couldn't update that prescription. Please try again." };
  }
}

/** Staff issue a form; the patient signs it. */
export async function issueConsentForm(input: {
  patientId: string;
  title: string;
  body: string;
}): Promise<ActionResult> {
  try {
    const session = await requireRole([...STAFF]);
    const patient = await getPatientById(session.user.organizationId, input.patientId);
    if (!patient) return { ok: false, error: "Patient not found." };

    const title = input.title.trim();
    const body = input.body.trim();
    if (!title) return { ok: false, error: "Give the form a title." };
    if (!body) return { ok: false, error: "Add the text the patient is agreeing to." };

    const created = await prisma.consentForm.create({
      data: { organizationId: session.user.organizationId, patientId: input.patientId, title, body },
      select: { id: true },
    });

    await writeAuditLog({
      organizationId: session.user.organizationId,
      actorUserId: session.user.id,
      action: "consentForm.issue",
      resourceType: "ConsentForm",
      resourceId: created.id,
      metadata: { patientId: input.patientId, title },
    });

    revalidatePatient(input.patientId);
    return { ok: true };
  } catch {
    return { ok: false, error: "Couldn't issue that form. Please try again." };
  }
}

/**
 * The patient signs their own form. The patient record is resolved from the
 * session, never from a caller-supplied id, so one patient can't sign
 * another's consent by guessing an id.
 */
export async function signConsentForm(formId: string, signatureName: string): Promise<ActionResult> {
  try {
    const session = await requireRole(["PATIENT"]);
    const patient = await getPatientForUser(session.user.id);
    if (!patient) return { ok: false, error: "No patient record found for your account." };

    const name = signatureName.trim();
    if (name.length < 2) return { ok: false, error: "Type your full name to sign." };

    const form = await prisma.consentForm.findFirst({
      where: { id: formId, organizationId: session.user.organizationId, patientId: patient.id },
      select: { id: true, status: true },
    });
    if (!form) return { ok: false, error: "Form not found." };
    if (form.status === "SIGNED") return { ok: false, error: "That form is already signed." };

    await prisma.consentForm.update({
      where: { id: form.id },
      data: { status: "SIGNED", signatureName: name, signedAt: new Date() },
    });

    await writeAuditLog({
      organizationId: session.user.organizationId,
      actorUserId: session.user.id,
      action: "consentForm.sign",
      resourceType: "ConsentForm",
      resourceId: form.id,
      metadata: { patientId: patient.id },
    });

    revalidatePatient(patient.id);
    return { ok: true };
  } catch {
    return { ok: false, error: "Couldn't record your signature. Please try again." };
  }
}
