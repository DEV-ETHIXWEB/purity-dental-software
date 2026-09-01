import type { Metadata } from "next";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { DashboardHero } from "@/components/dentist/DashboardHero";
import { TodaysVisitsRing } from "@/components/dentist/TodaysVisitsRing";
import { WeeklyVisitsChart } from "@/components/dentist/WeeklyVisitsChart";
import { RecentConsultationCard } from "@/components/dentist/RecentConsultationCard";
import { FollowUpsCard } from "@/components/dentist/FollowUpsCard";
import { AppointmentListItem } from "@/components/dentist/AppointmentListItem";
import { MiniCalendar } from "@/components/dentist/MiniCalendar";
import {
  appointments,
  todaysAppointments,
  weeklyVisitCounts,
  followUps,
  getPatientById,
  currentProvider,
} from "@/lib/sample-data";

export const metadata: Metadata = {
  title: "Dashboard",
  description: "Today's visits, weekly volume, follow-ups, and upcoming appointments.",
};

const TODAY = new Date("2026-08-24T12:00:00.000Z");

export default function DashboardPage() {
  const today = todaysAppointments();
  const completedToday = today.filter((a) => a.status === "COMPLETED").length;
  const weekly = weeklyVisitCounts();

  const recentPatient = getPatientById("pat_sarah_johnson")!;
  const upcoming = [...appointments]
    .filter((a) => new Date(a.startTime) >= TODAY && a.status !== "CANCELLED")
    .sort((a, b) => a.startTime.localeCompare(b.startTime))
    .slice(0, 5);

  const markedDates = new Set(appointments.map((a) => a.startTime.slice(0, 10)));

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold text-text-primary">
          Good afternoon, {currentProvider.name}
        </h1>
        <p className="text-sm text-text-secondary">
          Here&apos;s what&apos;s happening in your practice today.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2 overflow-hidden">
          <div className="grid grid-cols-1 sm:grid-cols-2">
            <CardContent className="flex flex-col justify-center gap-6">
              <TodaysVisitsRing completed={completedToday} total={today.length || 1} />
              <div>
                <p className="mb-3 text-sm font-semibold text-text-primary">This Week</p>
                <WeeklyVisitsChart data={weekly} />
              </div>
            </CardContent>
            <DashboardHero />
          </div>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Upcoming</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <MiniCalendar referenceDate={TODAY} markedDates={markedDates} />
            <ul className="divide-y divide-border">
              {upcoming.map((a) => (
                <AppointmentListItem key={a.id} appointment={a} />
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <RecentConsultationCard
          patient={recentPatient}
          observation="Patient reports mild sensitivity on the upper right quadrant. Recommended a follow-up in 3 months to reassess after the composite filling."
        />
        <FollowUpsCard items={followUps} />
      </div>
    </div>
  );
}
