import type { Metadata } from "next";
import Link from "next/link";
import { CalendarPlus } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { FrontDeskStatsRow } from "@/components/receptionist/FrontDeskStatsRow";
import { TodaysVisitsList } from "@/components/receptionist/TodaysVisitsList";
import { FollowUpsCard } from "@/components/dentist/FollowUpsCard";
import { requireRole } from "@/lib/auth/authorize";
import { todaysPracticeAppointments } from "@/lib/data/appointments";
import { listFollowUps } from "@/lib/data/patients";

export const metadata: Metadata = {
  title: "Front Desk Dashboard",
  description: "Today's visits, check-in status, and quick front-desk actions.",
};

export default async function ReceptionistDashboardPage() {
  const session = await requireRole(["RECEPTIONIST", "ADMIN"]);
  const { organizationId } = session.user;

  const [today, followUps] = await Promise.all([
    todaysPracticeAppointments(organizationId),
    listFollowUps(organizationId),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-text-primary">Front Desk</h1>
          <p className="text-sm text-text-secondary">
            {today.length} visit{today.length === 1 ? "" : "s"} across the practice today.
          </p>
        </div>
        <Link
          href="/receptionist/schedule"
          className="inline-flex h-10 items-center gap-2 self-start rounded-[var(--radius-lg)] border border-border bg-transparent px-4 text-sm font-medium text-text-primary transition-colors hover:bg-surface-muted focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-brand-blue)]"
        >
          <CalendarPlus className="h-4 w-4" aria-hidden="true" />
          Book Appointment
        </Link>
      </div>

      <FrontDeskStatsRow todaysAppointments={today} />

      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Today&apos;s Visits</CardTitle>
          </CardHeader>
          <CardContent>
            <TodaysVisitsList appointments={today} />
          </CardContent>
        </Card>

        <FollowUpsCard patients={followUps} />
      </div>
    </div>
  );
}
