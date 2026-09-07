import type { Metadata } from "next";
import { PracticeScheduleBoard } from "@/components/receptionist/PracticeScheduleBoard";
import { requireRole } from "@/lib/auth/authorize";
import { todaysPracticeAppointments } from "@/lib/data/appointments";
import { listProviders } from "@/lib/data/providers";

export const metadata: Metadata = {
  title: "Schedule",
  description: "Practice-wide appointment calendar across every provider.",
};

export default async function ReceptionistSchedulePage() {
  const session = await requireRole(["RECEPTIONIST", "ADMIN"]);
  const { organizationId } = session.user;
  const today = new Date();

  const [todaysAppointments, providers] = await Promise.all([
    todaysPracticeAppointments(organizationId),
    listProviders(organizationId),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold text-text-primary">Schedule</h1>
        <p className="text-sm text-text-secondary">
          {todaysAppointments.length} appointment{todaysAppointments.length === 1 ? "" : "s"} today across {providers.length} providers.
        </p>
      </div>

      <PracticeScheduleBoard date={today} appointments={todaysAppointments} providers={providers} />
    </div>
  );
}
