import type { Metadata } from "next";
import { PracticeScheduleBoard } from "@/components/receptionist/PracticeScheduleBoard";
import { todaysPracticeAppointments, practiceProviders } from "@/lib/sample-data";

export const metadata: Metadata = {
  title: "Schedule",
  description: "Practice-wide appointment calendar across every provider.",
};

const TODAY = new Date("2026-08-24T12:00:00.000Z");

export default function ReceptionistSchedulePage() {
  const today = todaysPracticeAppointments();

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold text-text-primary">Schedule</h1>
        <p className="text-sm text-text-secondary">
          {today.length} appointment{today.length === 1 ? "" : "s"} today across {practiceProviders.length} providers.
        </p>
      </div>

      <PracticeScheduleBoard date={TODAY} appointments={today} providers={practiceProviders} />
    </div>
  );
}
