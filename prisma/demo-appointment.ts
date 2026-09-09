import "dotenv/config";
import { prisma } from "../src/lib/prisma";

/**
 * Dev-only helper: books one upcoming visit for the seeded patient (Sarah
 * Johnson) so the dashboard hero, the "Next appointment" panel and the
 * countdown can be reviewed with real content. The seed deliberately leaves
 * her with no future appointment, which renders all three in their empty
 * state.
 *
 * Idempotent: re-running replaces the previous demo appointment rather than
 * stacking another one up. Run `npx prisma db seed` to get back to the
 * pristine seeded state.
 */
/**
 * The UTC instant at which the clinic's wall clock reads `hour:minute` on
 * the given day. `setHours` alone would use whatever timezone this script
 * happens to run in, which is how a "10:30 AM" booking ended up rendering
 * as 1:00 AM once the UI formatted it in the practice's zone.
 */
function atClinicTime(day: Date, hour: number, minute: number, timeZone: string): Date {
  const ymd = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(day);
  const naive = new Date(
    `${ymd}T${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}:00Z`,
  );
  // How far the target zone sits from UTC at that moment, DST included.
  const offsetMs =
    new Date(naive.toLocaleString("en-US", { timeZone })).getTime() -
    new Date(naive.toLocaleString("en-US", { timeZone: "UTC" })).getTime();
  return new Date(naive.getTime() - offsetMs);
}

async function main() {
  const patient = await prisma.patient.findFirst({ where: { email: "sarah.johnson@example.com" } });
  const provider = await prisma.user.findFirst({ where: { role: "DENTIST" } });
  if (!patient || !provider) throw new Error("Seed the database first: npx prisma db seed");

  await prisma.appointment.deleteMany({
    where: { patientId: patient.id, notes: "demo-appointment" },
  });

  const organization = await prisma.organization.findUnique({
    where: { id: patient.organizationId },
    select: { timezone: true },
  });
  const timeZone = organization?.timezone ?? "America/New_York";

  const inNineDays = new Date();
  inNineDays.setDate(inNineDays.getDate() + 9);
  const startTime = atClinicTime(inNineDays, 10, 30, timeZone);

  const appointment = await prisma.appointment.create({
    data: {
      organizationId: patient.organizationId,
      patientId: patient.id,
      providerId: provider.id,
      status: "CONFIRMED",
      procedureType: "Routine Check-up",
      notes: "demo-appointment",
      startTime,
      endTime: new Date(startTime.getTime() + 45 * 60_000),
    },
  });

  console.log(`Demo appointment ${appointment.id} booked for ${startTime.toDateString()} (9 days out)`);
}

main().finally(() => prisma.$disconnect());
