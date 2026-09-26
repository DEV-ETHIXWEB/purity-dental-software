import type { Metadata } from "next";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { DashboardHero } from "@/components/dentist/DashboardHero";
import { TodaysVisitsCard } from "@/components/dentist/TodaysVisitsCard";
import { RecentConsultationCard } from "@/components/dentist/RecentConsultationCard";
import { FollowUpsCard } from "@/components/dentist/FollowUpsCard";
import { UpcomingCard } from "@/components/dentist/UpcomingCard";
import { requirePageRole } from "@/lib/auth/require-portal";
import {
  appointmentsForProvider,
  weeklyVisitCounts,
  todaysVisitBreakdown,
} from "@/lib/data/appointments";
import { listFollowUps, recentlyRemindedPatientIds } from "@/lib/data/patients";
import { clinicTimeZone } from "@/lib/data/organization";
import { formatClinicDate } from "@/lib/datetime";

export const metadata: Metadata = {
  title: "Dashboard",
  description: "Today's visits, weekly volume, follow-ups, and upcoming appointments.",
};

export default async function DashboardPage() {
  const session = await requirePageRole(["DENTIST", "ADMIN"]);
  const timeZone = await clinicTimeZone(session.user.organizationId);
  const { organizationId, id: providerId, name } = session.user;

  const [visitBreakdown, weekly, allAppointments, followUps] = await Promise.all([
    todaysVisitBreakdown(organizationId, providerId, timeZone),
    weeklyVisitCounts(organizationId, providerId, timeZone),
    appointmentsForProvider(organizationId, providerId),
    listFollowUps(organizationId),
  ]);

  const recentConsultation = allAppointments
    .filter((a) => a.status === "COMPLETED")
    .sort((a, b) => b.startTime.getTime() - a.startTime.getTime())[0];

  // Which follow-ups already had a reminder inside the cooldown, so the
  // button renders as "Reminded" instead of inviting a refused send.
  const remindedPatientIds = [
    ...(await recentlyRemindedPatientIds(
      organizationId,
      followUps.map((p) => p.id),
    )),
  ];

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

      <div className="grid grid-cols-1 items-stretch gap-6 md:grid-cols-2 xl:grid-cols-3">
        {recentConsultation ? (
          <RecentConsultationCard
            timeZone={timeZone}
            patient={recentConsultation.patient}
            lastVisitAt={recentConsultation.startTime}
            observation={`${recentConsultation.procedureType} completed on ${formatClinicDate(recentConsultation.startTime, timeZone)}.`}
          />
        ) : (
          <Card className="animate-rise-in stagger-3 flex h-full flex-col transition-shadow duration-300 ease-out hover:shadow-card-hover">
            <CardHeader>
              <CardTitle>Recent Consultation</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-text-secondary">No completed visits yet.</p>
            </CardContent>
          </Card>
        )}

        <FollowUpsCard patients={followUps} remindedPatientIds={remindedPatientIds} />

        <UpcomingCard appointments={allAppointments} />
      </div>
    </div>
  );
}
