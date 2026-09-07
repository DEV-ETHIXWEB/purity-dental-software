import "server-only";
import { prisma } from "@/lib/prisma";
import type { WaitlistEntry, Patient } from "@/generated/prisma/client";

/** "Open Time / ASAP" waitlist — Figma flow: Schedule/appointments → Waitlist drag n drop. */

export type WaitlistEntryWithPatient = WaitlistEntry & { patient: Patient };

export async function listWaitlistEntries(organizationId: string): Promise<WaitlistEntryWithPatient[]> {
  return prisma.waitlistEntry.findMany({
    where: { organizationId },
    include: { patient: true },
    orderBy: { createdAt: "asc" },
  });
}

/** Scoped by organizationId so one tenant can never resolve another tenant's waitlist entry by guessing an id. */
export async function getWaitlistEntryById(
  organizationId: string,
  id: string,
): Promise<WaitlistEntryWithPatient | null> {
  return prisma.waitlistEntry.findFirst({ where: { id, organizationId }, include: { patient: true } });
}

/** Remove a waitlist entry once it's been dropped onto an open slot and booked. */
export async function removeWaitlistEntry(organizationId: string, id: string): Promise<void> {
  await prisma.waitlistEntry.deleteMany({ where: { id, organizationId } });
}
