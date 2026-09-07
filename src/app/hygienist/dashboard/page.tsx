import type { Metadata } from "next";
import { CalendarCheck, TrendingUp, BellRing, Clock3 } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { StatStrip } from "@/components/ui/StatStrip";
import { WeeklyVisitsChart } from "@/components/dentist/WeeklyVisitsChart";
import { RecentConsultationCard } from "@/components/dentist/RecentConsultationCard";
import { FollowUpsCard } from "@/components/dentist/FollowUpsCard";
import { TodaysScheduleCard } from "@/components/dentist/TodaysScheduleCard";
import { requireRole } from "@/lib/auth/authorize";
import {
  appointmentsForProvider,
  todaysAppointmentsForProvider,
  weeklyVisitCounts,
} from "@/lib/data/appointments";
import { listFollowUps } from "@/lib/data/patients";

export const metadata: Metadata = {
  title: "Dashboard",
  description: "Today's visits, weekly volume, follow-ups, and upcoming appointments.",
};

export default async function HygienistDashboardPage() {
  const session = await requireRole(["HYGIENIST", "ADMIN"]);
  const { organizationId, id: providerId, name } = session.user;

  const [today, weekly, allAppointments, followUps] = await Promise.all([
    todaysAppointmentsForProvider(organizationId, providerId),
    weeklyVisitCounts(organizationId, providerId),
    appointmentsForProvider(organizationId, providerId),
    listFollowUps(organizationId),
  ]);

  const completedToday = today.filter((a) => a.status === "COMPLETED").length;
  const now = new Date();
  const nextUp = today
    .filter((a) => a.startTime >= now && a.status !== "CANCELLED" && a.status !== "COMPLETED")
    .sort((a, b) => a.startTime.getTime() - b.startTime.getTime())[0];
  const recentConsultation = allAppointments
    .filter((a) => a.status === "COMPLETED")
    .sort((a, b) => b.startTime.getTime() - a.startTime.getTime())[0];

  const hour = now.getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";
  const weeklyVisitTotal = weekly.reduce((sum, d) => sum + d.count, 0);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-text-primary">
          {greeting}, {name}
        </h1>
        <p className="text-sm text-text-secondary">
          Here&apos;s what&apos;s happening with your patients today.
        </p>
      </div>

      <StatStrip
        items={[
          { label: "Today", value: `${completedToday}/${today.length}`, icon: CalendarCheck },
          { label: "This week", value: weeklyVisitTotal, icon: TrendingUp },
          {
            label: "Recalls due",
            value: followUps.length,
            icon: BellRing,
            tone: followUps.length > 0 ? "warning" : "default",
          },
          { label: "Next up", value: nextUp ? nextUp.startTime.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" }) : "—", icon: Clock3 },
        ]}
      />

      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <TodaysScheduleCard appointments={today} completed={completedToday} basePath="/hygienist" scheduleHref="/hygienist/schedule" />
        </div>
        <FollowUpsCard patients={followUps} />
      </div>

      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-2">
        {recentConsultation ? (
          <RecentConsultationCard
            patient={recentConsultation.patient}
            observation={`${recentConsultation.procedureType} completed on ${recentConsultation.startTime.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}.`}
            basePath="/hygienist"
          />
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>Recent Consultation</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-text-secondary">No completed visits yet.</p>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle>This Week</CardTitle>
          </CardHeader>
          <CardContent>
            <WeeklyVisitsChart data={weekly} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
