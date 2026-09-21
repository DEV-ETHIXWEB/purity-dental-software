import "server-only";
import { prisma } from "@/lib/prisma";
import type { User } from "@/generated/prisma/client";

/** Clinical staff (Dentist/Hygienist) in the org — the Receptionist portal's practice-wide provider filter. */
export async function listProviders(organizationId: string): Promise<User[]> {
  return prisma.user.findMany({
    where: { organizationId, role: { in: ["DENTIST", "HYGIENIST"] }, isActive: true },
    orderBy: { name: "asc" },
  });
}

/**
 * Every clinician in the org, disabled ones included — for the front desk's
 * Team screen, which has to show a switched-off account in order to switch it
 * back on. `listProviders` above stays active-only: a disabled clinician must
 * never appear in a booking picker.
 */
export async function listAllProviders(organizationId: string): Promise<User[]> {
  return prisma.user.findMany({
    where: { organizationId, role: { in: ["DENTIST", "HYGIENIST"] } },
    orderBy: [{ isActive: "desc" }, { name: "asc" }],
  });
}

/**
 * Scoped by organizationId so one tenant can never book an appointment onto
 * another tenant's clinician by guessing/supplying a foreign providerId.
 * Only active Dentist/Hygienist accounts count as bookable providers.
 */
export async function getProviderById(organizationId: string, id: string): Promise<User | null> {
  return prisma.user.findFirst({
    where: { id, organizationId, role: { in: ["DENTIST", "HYGIENIST"] }, isActive: true },
  });
}
