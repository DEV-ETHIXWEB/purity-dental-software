import "server-only";
import { prisma } from "@/lib/prisma";

/**
 * The signed-in user's practice. Only the presentational bits — the name
 * shown in portal headers and the `timezone` every patient-facing date is
 * rendered in (appointments are stored as UTC instants; see the note on
 * `Appointment.startTime` in prisma/schema.prisma).
 */
export async function getOrganization(organizationId: string) {
  return prisma.organization.findUnique({
    where: { id: organizationId },
    select: { name: true, timezone: true },
  });
}
