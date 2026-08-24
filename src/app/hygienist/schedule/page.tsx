import type { Metadata } from "next";
import { ScheduleBoard } from "@/components/dentist/ScheduleBoard";
import { practiceAppointments, scheduleWaitlist, currentHygienist } from "@/lib/sample-data";

export const metadata: Metadata = {
  title: "Schedule",
  description: "Today's appointments, open time waitlist, and visit history.",
};

const TODAY = new Date("2026-08-24T12:00:00.000Z");

export default function HygienistSchedulePage() {
  const todayIso = TODAY.toISOString().slice(0, 10);
  const hygienistAppointments = practiceAppointments().filter(
    (a) => a.providerId === currentHygienist.id,
  );
  const todaysAppointments = hygienistAppointments.filter((a) =>
    a.startTime.startsWith(todayIso),
  );
  const recentVisits = hygienistAppointments
    .filter((a) => a.status === "COMPLETED")
    .sort((a, b) => b.startTime.localeCompare(a.startTime));

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold text-text-primary">Schedule</h1>
        <p className="text-sm text-text-secondary">
          {todaysAppointments.length} appointments today.
        </p>
      </div>

      <ScheduleBoard
        date={TODAY}
        appointments={todaysAppointments}
        waitlist={scheduleWaitlist}
        recentVisits={recentVisits}
        providerId={currentHygienist.id}
        providerName={currentHygienist.name}
      />
    </div>
  );
}
