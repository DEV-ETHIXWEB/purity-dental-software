import type { Metadata } from "next";
import { PracticeScheduleBoard } from "@/components/receptionist/PracticeScheduleBoard";
import { requirePageRole } from "@/lib/auth/require-portal";
import { todaysPracticeAppointments } from "@/lib/data/appointments";
import { listProviders } from "@/lib/data/providers";
import { listPatients } from "@/lib/data/patients";
import { practiceAppointments } from "@/lib/data/appointments";
import { isUnresolvedPastVisit } from "@/lib/appointment-status";
import { clinicTimeZone } from "@/lib/data/organization";

export const metadata: Metadata = {
  title: "Schedule",
  description: "Practice-wide appointment calendar across every provider.",
};

export default async function ReceptionistSchedulePage({ searchParams }: PageProps<"/receptionist/schedule">) {
  const session = await requirePageRole(["RECEPTIONIST", "ADMIN"]);
  const timeZone = await clinicTimeZone(session.user.organizationId);
  const { organizationId } = session.user;
  const today = new Date();

  const [todaysAppointments, providers, patients, allAppointments, { book }] = await Promise.all([
    todaysPracticeAppointments(organizationId, timeZone),
    listProviders(organizationId),
    listPatients(organizationId),
    practiceAppointments(organizationId),
    searchParams,
  ]);

  // Past visits nobody ever closed out — see lib/appointment-status.ts.
  const unresolvedPast = allAppointments.filter((a) => isUnresolvedPastVisit(a, today));

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold text-text-primary">Schedule</h1>
        <p className="text-sm text-text-secondary">
          {todaysAppointments.length} appointment{todaysAppointments.length === 1 ? "" : "s"} today across {providers.length} providers.
        </p>
      </div>

      <PracticeScheduleBoard
        date={today}
        appointments={todaysAppointments}
        providers={providers}
        patients={patients}
        unresolvedPast={unresolvedPast}
        openBookingOnMount={book === "1"}
      />
    </div>
  );
}
