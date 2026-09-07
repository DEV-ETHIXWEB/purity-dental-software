import type { Metadata } from "next";
import { ScheduleBoard } from "@/components/dentist/ScheduleBoard";
import { requireRole } from "@/lib/auth/authorize";
import { todaysAppointmentsForProvider, appointmentsForProvider } from "@/lib/data/appointments";
import { listWaitlistEntries } from "@/lib/data/waitlist";

export const metadata: Metadata = {
  title: "My Schedule",
  description: "Today's appointments, open time waitlist, and visit history.",
};

export default async function SchedulePage() {
  const session = await requireRole(["DENTIST", "ADMIN"]);
  const { organizationId, id: providerId } = session.user;
  const today = new Date();

  const [todaysAppointments, allAppointments, waitlist] = await Promise.all([
    todaysAppointmentsForProvider(organizationId, providerId),
    appointmentsForProvider(organizationId, providerId),
    listWaitlistEntries(organizationId),
  ]);

  const recentVisits = allAppointments
    .filter((a) => a.status === "COMPLETED")
    .sort((a, b) => b.startTime.getTime() - a.startTime.getTime());

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold text-text-primary">My Schedule</h1>
        <p className="text-sm text-text-secondary">
          {todaysAppointments.length} appointments today.
        </p>
      </div>

      <ScheduleBoard
        date={today}
        appointments={todaysAppointments}
        waitlist={waitlist}
        recentVisits={recentVisits}
        providerId={providerId}
      />
    </div>
  );
}
