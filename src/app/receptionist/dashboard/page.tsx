import type { Metadata } from "next";
import Link from "next/link";
import { UserPlus, CalendarPlus } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { FrontDeskStatsRow } from "@/components/receptionist/FrontDeskStatsRow";
import { TodaysVisitsList } from "@/components/receptionist/TodaysVisitsList";
import { FollowUpsCard } from "@/components/dentist/FollowUpsCard";
import { MiniCalendar } from "@/components/dentist/MiniCalendar";
import {
  todaysPracticeAppointments,
  practiceAppointments,
  followUps,
} from "@/lib/sample-data";

export const metadata: Metadata = {
  title: "Front Desk Dashboard",
  description: "Today's visits, check-in status, and quick front-desk actions.",
};

const TODAY = new Date("2026-08-24T12:00:00.000Z");

export default function ReceptionistDashboardPage() {
  const today = todaysPracticeAppointments();
  const markedDates = new Set(practiceAppointments().map((a) => a.startTime.slice(0, 10)));

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-text-primary">Front Desk</h1>
          <p className="text-sm text-text-secondary">
            {today.length} visit{today.length === 1 ? "" : "s"} across the practice today.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Link
            href="/receptionist/patients/new"
            className="inline-flex h-10 items-center gap-2 rounded-[var(--radius-lg)] border border-border bg-transparent px-4 text-sm font-medium text-text-primary transition-colors hover:bg-surface-muted focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-brand-blue)]"
          >
            <UserPlus className="h-4 w-4" aria-hidden="true" />
            Register Patient
          </Link>
          <Link
            href="/receptionist/schedule"
            className="brand-gradient-bg inline-flex h-10 items-center gap-2 rounded-[var(--radius-lg)] px-4 text-sm font-medium text-white shadow-card transition-opacity hover:opacity-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-brand-blue)]"
          >
            <CalendarPlus className="h-4 w-4" aria-hidden="true" />
            Book Appointment
          </Link>
        </div>
      </div>

      <FrontDeskStatsRow todaysAppointments={today} />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Today&apos;s Visits</CardTitle>
          </CardHeader>
          <CardContent>
            <TodaysVisitsList appointments={today} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Upcoming</CardTitle>
          </CardHeader>
          <CardContent>
            <MiniCalendar referenceDate={TODAY} markedDates={markedDates} />
          </CardContent>
        </Card>
      </div>

      <FollowUpsCard items={followUps} />
    </div>
  );
}
