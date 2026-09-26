import "server-only";
import { prisma } from "@/lib/prisma";
import { DEFAULT_CLINIC_TIMEZONE } from "@/lib/datetime";

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

/**
 * The full practice record the Admin portal's Practice settings edits.
 *
 * Separate from `getOrganization` rather than widening it: that one feeds
 * every portal's shell on every request, and the contact fields are of no
 * use there.
 */
export async function getPracticeDetails(organizationId: string) {
  return prisma.organization.findUnique({
    where: { id: organizationId },
    select: {
      name: true,
      timezone: true,
      phone: true,
      email: true,
      addressLine: true,
    },
  });
}

/**
 * The practice's IANA timezone, with the schema default applied.
 *
 * Server Components that render an appointment time or record date call this
 * and pass the result down — they can't read `useClinicTimeZone()`, which only
 * works inside Client Components under the portal shell.
 */
export async function clinicTimeZone(organizationId: string): Promise<string> {
  const organization = await getOrganization(organizationId);
  return organization?.timezone ?? DEFAULT_CLINIC_TIMEZONE;
}
