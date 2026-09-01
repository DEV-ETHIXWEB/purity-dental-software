import type { Metadata } from "next";
import { ScheduleBoard } from "@/components/dentist/ScheduleBoard";
import { appointments, scheduleWaitlist } from "@/lib/sample-data";

export const metadata: Metadata = {
  title: "My Schedule",
  description: "Today's appointments, open time waitlist, and visit history.",
};

const TODAY = new Date("2026-08-24T12:00:00.000Z");

export default function SchedulePage() {
  const todayIso = TODAY.toISOString().slice(0, 10);
  const todaysAppointments = appointments.filter((a) => a.startTime.startsWith(todayIso));
  const recentVisits = appointments
    .filter((a) => a.status === "COMPLETED")
    .sort((a, b) => b.startTime.localeCompare(a.startTime));

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold text-text-primary">My Schedule</h1>
        <p className="text-sm text-text-secondary">
          {todaysAppointments.length} appointments today.
        </p>
      </div>

      <ScheduleBoard
        date={TODAY}
        appointments={todaysAppointments}
        waitlist={scheduleWaitlist}
        recentVisits={recentVisits}
      />
    </div>
  );
}
