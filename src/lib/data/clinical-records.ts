import "server-only";
import { prisma } from "@/lib/prisma";
import type {
  ConsentForm,
  Document,
  DocumentKind,
  Prescription,
  User,
} from "@/generated/prisma/client";

/**
 * Reads for the three patient-record types added alongside the clinical
 * chart: uploaded documents (X-rays, reports, referrals), prescriptions, and
 * consent forms.
 *
 * Document rows deliberately never select `data` here — the bytes are only
 * ever streamed by the download route, so a list query can't accidentally
 * pull several megabytes of imaging into a page render.
 */

/** A document without its bytes — everything a list needs, nothing it doesn't. */
export type DocumentSummary = Omit<Document, "data"> & { uploadedBy: Pick<User, "name"> | null };

export type PrescriptionWithPrescriber = Prescription & { prescriber: Pick<User, "name"> | null };

const DOCUMENT_LIST_SELECT = {
  id: true,
  organizationId: true,
  patientId: true,
  kind: true,
  title: true,
  fileName: true,
  mimeType: true,
  sizeBytes: true,
  uploadedById: true,
  uploadedAt: true,
  createdAt: true,
  updatedAt: true,
  uploadedBy: { select: { name: true } },
} as const;

export async function listDocuments(
  organizationId: string,
  patientId: string,
): Promise<DocumentSummary[]> {
  return prisma.document.findMany({
    where: { organizationId, patientId },
    select: DOCUMENT_LIST_SELECT,
    orderBy: { uploadedAt: "desc" },
  });
}

/** Bytes + headers for the download route. Scoped by org so an id alone isn't enough. */
export async function getDocumentFile(
  organizationId: string,
  patientId: string,
  documentId: string,
): Promise<Pick<Document, "data" | "mimeType" | "fileName"> | null> {
  return prisma.document.findFirst({
    where: { id: documentId, organizationId, patientId },
    select: { data: true, mimeType: true, fileName: true },
  });
}

export async function listPrescriptions(
  organizationId: string,
  patientId: string,
): Promise<PrescriptionWithPrescriber[]> {
  return prisma.prescription.findMany({
    where: { organizationId, patientId },
    include: { prescriber: { select: { name: true } } },
    orderBy: { prescribedAt: "desc" },
  });
}

export async function listConsentForms(
  organizationId: string,
  patientId: string,
): Promise<ConsentForm[]> {
  return prisma.consentForm.findMany({
    where: { organizationId, patientId },
    // Anything still needing a signature sorts to the top.
    orderBy: [{ status: "asc" }, { createdAt: "desc" }],
  });
}

/** Everything the patient's "My Care" page shows, in one round trip. */
export async function patientRecords(organizationId: string, patientId: string) {
  const [documents, prescriptions, consentForms] = await Promise.all([
    listDocuments(organizationId, patientId),
    listPrescriptions(organizationId, patientId),
    listConsentForms(organizationId, patientId),
  ]);
  return { documents, prescriptions, consentForms };
}

export const DOCUMENT_KIND_LABEL: Record<DocumentKind, string> = {
  XRAY: "X-ray",
  REPORT: "Report",
  REFERRAL: "Referral",
  OTHER: "Other",
};
