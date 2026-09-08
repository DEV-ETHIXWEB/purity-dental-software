import type { Metadata } from "next";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { DashboardHero } from "@/components/dentist/DashboardHero";
import { TodaysVisitsCard } from "@/components/dentist/TodaysVisitsCard";
import { RecentConsultationCard } from "@/components/dentist/RecentConsultationCard";
import { FollowUpsCard } from "@/components/dentist/FollowUpsCard";
import { UpcomingCard } from "@/components/dentist/UpcomingCard";
import { requireRole } from "@/lib/auth/authorize";
import {
  appointmentsForProvider,
  weeklyVisitCounts,
  todaysVisitBreakdown,
} from "@/lib/data/appointments";
import { listFollowUps } from "@/lib/data/patients";

export const metadata: Metadata = {
  title: "Dashboard",
  description: "Today's visits, weekly volume, follow-ups, and upcoming appointments.",
};

export default async function DashboardPage() {
  const session = await requireRole(["DENTIST", "ADMIN"]);
  const { organizationId, id: providerId, name } = session.user;

  const [visitBreakdown, weekly, allAppointments, followUps] = await Promise.all([
    todaysVisitBreakdown(organizationId, providerId),
    weeklyVisitCounts(organizationId, providerId),
    appointmentsForProvider(organizationId, providerId),
    listFollowUps(organizationId),
  ]);

  const recentConsultation = allAppointments
    .filter((a) => a.status === "COMPLETED")
    .sort((a, b) => b.startTime.getTime() - a.startTime.getTime())[0];

  return (
    <div className="flex flex-col gap-6">
      <div className="animate-rise-in stagger-0">
        <h1 className="text-2xl font-semibold tracking-tight text-text-primary">Dashboard</h1>
        <p className="text-sm text-text-secondary">Welcome back, {name}</p>
      </div>

      <div className="grid grid-cols-1 items-stretch gap-6 lg:grid-cols-5">
        <div className="lg:col-span-2">
          <DashboardHero onTimePct={visitBreakdown.onTimePct} recallsDue={followUps.length} />
        </div>
        <div className="lg:col-span-3">
          <TodaysVisitsCard
            total={visitBreakdown.total}
            newCount={visitBreakdown.newCount}
            returningCount={visitBreakdown.returningCount}
            weekly={weekly}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-3">
        {recentConsultation ? (
          <RecentConsultationCard
            patient={recentConsultation.patient}
            observation={`${recentConsultation.procedureType} completed on ${recentConsultation.startTime.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}.`}
          />
        ) : (
          <Card className="animate-rise-in stagger-3 transition-shadow duration-300 ease-out hover:shadow-card-hover">
            <CardHeader>
              <CardTitle>Recent Consultation</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-text-secondary">No completed visits yet.</p>
            </CardContent>
          </Card>
        )}

        <FollowUpsCard patients={followUps} />

        <UpcomingCard appointments={allAppointments} />
      </div>
    </div>
  );
}
