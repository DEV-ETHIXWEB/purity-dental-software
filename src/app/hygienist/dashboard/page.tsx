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
  practiceAppointments,
  weeklyVisitCounts,
  followUps,
  getPatientById,
  currentHygienist,
} from "@/lib/sample-data";

export const metadata: Metadata = {
  title: "Dashboard",
  description: "Today's visits, weekly volume, follow-ups, and upcoming appointments.",
};

const TODAY = new Date("2026-08-24T12:00:00.000Z");

export default function HygienistDashboardPage() {
  const hygienistAppointments = practiceAppointments().filter(
    (a) => a.providerId === currentHygienist.id,
  );
  const todayIso = TODAY.toISOString().slice(0, 10);
  const today = hygienistAppointments.filter((a) => a.startTime.startsWith(todayIso));
  const completedToday = today.filter(
    (a) => a.status === "COMPLETED" || a.status === "CHECKED_IN",
  ).length;
  const weekly = weeklyVisitCounts();

  const recentPatient = getPatientById("pat_olivia_martinez")!;
  const upcoming = [...hygienistAppointments]
    .filter((a) => new Date(a.startTime) >= TODAY && a.status !== "CANCELLED")
    .sort((a, b) => a.startTime.localeCompare(b.startTime))
    .slice(0, 5);

  const markedDates = new Set(hygienistAppointments.map((a) => a.startTime.slice(0, 10)));

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold text-text-primary">
          Good afternoon, {currentHygienist.name}
        </h1>
        <p className="text-sm text-text-secondary">
          Here&apos;s what&apos;s happening with your patients today.
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
                <AppointmentListItem key={a.id} appointment={a} basePath="/hygienist" />
              ))}
            </ul>
            {upcoming.length === 0 && (
              <p className="text-sm text-text-secondary">No upcoming visits scheduled.</p>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <RecentConsultationCard
          patient={recentPatient}
          observation="Patient presented with mild gingival inflammation on the lower left quadrant. Reinforced flossing technique and recommended a recall cleaning in 3 months."
          basePath="/hygienist"
        />
        <FollowUpsCard items={followUps} />
      </div>
    </div>
  );
}
