import type { Metadata } from "next";
import { ScheduleBoard } from "@/components/dentist/ScheduleBoard";
import { requirePageRole } from "@/lib/auth/require-portal";
import { todaysAppointmentsForProvider, appointmentsForProvider } from "@/lib/data/appointments";
import { listWaitlistEntries } from "@/lib/data/waitlist";
import { listPatients } from "@/lib/data/patients";
import { getProviderById } from "@/lib/data/providers";
import { isUnresolvedPastVisit } from "@/lib/appointment-status";
import { clinicTimeZone } from "@/lib/data/organization";

export const metadata: Metadata = {
  title: "Schedule",
  description: "Today's appointments, open time waitlist, and visit history.",
};

export default async function HygienistSchedulePage({ searchParams }: PageProps<"/hygienist/schedule">) {
  const session = await requirePageRole(["HYGIENIST", "ADMIN"]);
  const timeZone = await clinicTimeZone(session.user.organizationId);
  const { organizationId, id: providerId } = session.user;
  const today = new Date();

  const [todaysAppointments, allAppointments, waitlist, patients, provider, { book }] = await Promise.all([
    todaysAppointmentsForProvider(organizationId, providerId, timeZone),
    appointmentsForProvider(organizationId, providerId),
    listWaitlistEntries(organizationId),
    listPatients(organizationId),
    getProviderById(organizationId, providerId),
    searchParams,
  ]);

  // Split on the server so the two calendars can't disagree with each other
  // about where "now" falls — a client-side split would re-evaluate at
  // hydration and could land a just-started appointment on both sides.
  const now = today.getTime();
  const upcomingAppointments = allAppointments.filter((a) => a.startTime.getTime() >= now);
  const pastAppointments = allAppointments.filter((a) => a.startTime.getTime() < now);
  // Past visits nobody ever closed out — see lib/appointment-status.ts.
  const unresolvedPast = pastAppointments.filter((a) => isUnresolvedPastVisit(a, today));

  return (
    <div className="flex flex-col gap-6">
      <div className="animate-rise-in stagger-0">
        <h1 className="text-2xl font-semibold text-text-primary">Schedule</h1>
        <p className="text-sm text-text-secondary">
          {todaysAppointments.length} {todaysAppointments.length === 1 ? "appointment" : "appointments"} today.
        </p>
      </div>

      <ScheduleBoard
        date={today}
        appointments={todaysAppointments}
        upcomingAppointments={upcomingAppointments}
        pastAppointments={pastAppointments}
        waitlist={waitlist}
        providerId={providerId}
        patients={patients}
        providers={provider ? [provider] : []}
        unresolvedPast={unresolvedPast}
        openBookingOnMount={book === "1"}
        basePath="/hygienist"
      />
    </div>
  );
}
