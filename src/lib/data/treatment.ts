import "server-only";
import { prisma } from "@/lib/prisma";
import type { TreatmentPlanItem, PerioChartEntry } from "@/generated/prisma/client";

/** Real Prisma-backed treatment plan + perio chart queries. */

export async function treatmentPlanForPatient(
  organizationId: string,
  patientId: string,
): Promise<TreatmentPlanItem[]> {
  return prisma.treatmentPlanItem.findMany({
    where: { organizationId, patientId },
    orderBy: { createdAt: "asc" },
  });
}

/** Most recent perio charting session for a patient, or null if none exist yet. */
export async function perioChartForPatient(
  organizationId: string,
  patientId: string,
): Promise<PerioChartEntry | null> {
  return prisma.perioChartEntry.findFirst({
    where: { organizationId, patientId },
    orderBy: { chartedAt: "desc" },
  });
}
