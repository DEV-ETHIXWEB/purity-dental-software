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
 * Scoped by organizationId so one tenant can never book an appointment onto
 * another tenant's clinician by guessing/supplying a foreign providerId.
 * Only active Dentist/Hygienist accounts count as bookable providers.
 */
export async function getProviderById(organizationId: string, id: string): Promise<User | null> {
  return prisma.user.findFirst({
    where: { id, organizationId, role: { in: ["DENTIST", "HYGIENIST"] }, isActive: true },
  });
}
