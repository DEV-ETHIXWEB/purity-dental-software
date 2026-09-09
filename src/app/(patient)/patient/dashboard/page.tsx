import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ChevronRight, Lock } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/patient/EmptyState";
import { PatientHero } from "@/components/patient/PatientHero";
import { QuickActions } from "@/components/patient/QuickActions";
import { NextAppointmentPanel } from "@/components/patient/NextAppointmentPanel";
import { BillingOverviewCard } from "@/components/patient/BillingOverviewCard";
import { ChatIconFilled } from "@/components/ui/icons/purity-icons";
import { PhoneIcon, CheckmarkIcon } from "@/components/ui/icons/purity-raster-icons";
import { TreatmentProgress } from "@/components/patient/TreatmentProgress";
import {
  greetingFor,
  formatHeroDate,
  daysBetween,
  formatAppointmentStamp,
} from "@/components/patient/formatters";
import { requirePageRole } from "@/lib/auth/require-portal";
import { getPatientForUser } from "@/lib/data/patients";
import { getOrganization } from "@/lib/data/organization";
import { appointmentsForPatient } from "@/lib/data/appointments";
import { treatmentPlanForPatient } from "@/lib/data/treatment";
import { patientBillingOverview } from "@/lib/data/billing";

export const metadata: Metadata = {
  title: "Dashboard",
  description: "Your next visit, treatment progress, balance and quick links to your care.",
};

export default async function PatientDashboardPage() {
  const session = await requirePageRole(["PATIENT"]);
  const patient = await getPatientForUser(session.user.id);
  if (!patient) notFound();

  const now = new Date();
  const [myAppointments, myPlan, organization, billing] = await Promise.all([
    appointmentsForPatient(session.user.organizationId, patient.id),
    treatmentPlanForPatient(session.user.organizationId, patient.id),
    getOrganization(session.user.organizationId),
    patientBillingOverview(session.user.organizationId, patient.id),
  ]);

  const nextAppointment =
    myAppointments
      .filter((a) => a.startTime >= now && a.status !== "CANCELLED")
      .sort((a, b) => a.startTime.getTime() - b.startTime.getTime())[0] ?? null;

  // Every patient-facing date renders in the practice's timezone, not the
  // server's — appointments are stored as UTC instants (see the note on
  // `Appointment.startTime` in prisma/schema.prisma).
  const timeZone = organization?.timezone ?? "America/New_York";
  const practiceName = organization?.name ?? "your practice";
  const daysUntilNextVisit = nextAppointment
    ? daysBetween(now, nextAppointment.startTime, timeZone)
    : null;

  // The plan's headline: the procedures still in play, joined — "Root canal
  // + crown" rather than a bare item count.
  const PLAN_ORDER = { COMPLETED: 1, ACTIVE: 2, PLANNED: 3, DECLINED: 4 } as const;
  const openPlanItems = myPlan
    .filter((i) => i.status !== "DECLINED")
    .sort((a, b) => PLAN_ORDER[a.status] - PLAN_ORDER[b.status]);
  const planTitle = Array.from(new Set(openPlanItems.map((i) => i.procedure))).join(" + ");
  const planInProgress = openPlanItems.some((i) => i.status === "ACTIVE");

  return (
    <div className="flex flex-col gap-6">
      <div className="animate-rise-in stagger-0">
        <h1 className="text-2xl font-semibold tracking-tight text-text-primary">
          {greetingFor(now, timeZone)}, {patient.firstName}
        </h1>
        <p className="text-sm text-text-secondary">
          {formatHeroDate(now, timeZone)} • {practiceName}
        </p>
      </div>

      {/* Hero band: the illustration and its next-visit card sit above the
          shortcuts, with the next visit given a fuller panel alongside.
          `items-start` keeps that panel hugging its own content — stretched
          to the left column's height it opens a dead gap under the action.

          The split starts at `md`, not `lg`: full-width the hero panel is
          far wider than the artwork's 1.87 aspect, and `object-cover` then
          crops the tooth's crown. Two thirds of a tablet viewport lands
          almost exactly on that ratio. */}
      <div className="grid grid-cols-1 items-start gap-6 md:grid-cols-3">
        <div className="flex flex-col gap-6 md:col-span-2">
          <PatientHero
            daysUntilNextVisit={daysUntilNextVisit}
            whenLabel={
              nextAppointment ? formatAppointmentStamp(nextAppointment.startTime, timeZone) : undefined
            }
            procedure={nextAppointment?.procedureType}
          />
          <QuickActions />

          <Card className="animate-rise-in stagger-3 transition-shadow duration-300 ease-out hover:shadow-card-hover">
            <CardHeader>
              <CardTitle>My treatment</CardTitle>
              {planInProgress && <Badge tone="brand-teal">In progress</Badge>}
            </CardHeader>
            <CardContent>
              {openPlanItems.length > 0 ? (
                <>
                  <p className="mb-4 text-base font-semibold text-text-primary">{planTitle}</p>
                  <TreatmentProgress items={myPlan} />
                </>
              ) : (
                <EmptyState
                  icon={CheckmarkIcon}
                  title="You're all caught up"
                  description="There's no active treatment plan on file for you right now."
                />
              )}
            </CardContent>
          </Card>
        </div>

        <div className="flex flex-col gap-6">
          <NextAppointmentPanel
            appointment={nextAppointment}
            practiceName={practiceName}
            timeZone={timeZone}
          />

          {billing && (
            <section aria-labelledby="balance-heading" className="flex flex-col gap-2">
              <div className="flex items-center justify-between gap-3">
                <h2
                  id="balance-heading"
                  className="text-[15px] font-semibold tracking-tight text-text-primary"
                >
                  My balance
                </h2>
                <Link
                  href="/patient/billing"
                  className="group inline-flex items-center gap-1 rounded-[var(--radius-sm)] text-sm font-medium text-[var(--color-brand-blue-text)] transition-colors duration-200 ease-out hover:text-text-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-brand-blue)]"
                >
                  View details
                  <ChevronRight
                    className="h-4 w-4 transition-transform duration-200 ease-out group-hover:translate-x-0.5 motion-reduce:group-hover:translate-x-0"
                    aria-hidden="true"
                  />
                </Link>
              </div>
              <BillingOverviewCard overview={billing} />
            </section>
          )}

          {/* "We're here to help" — a brand-tinted panel rather than another
              plain card, so the one place to reach a human doesn't read as
              just more page furniture. */}
          <Card className="decor-radial-blue-teal animate-rise-in stagger-5 transition-shadow duration-300 ease-out hover:shadow-card-hover">
            <CardHeader className="justify-start gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-surface shadow-card">
                <ChatIconFilled className="h-5 w-5" aria-hidden="true" />
              </span>
              <CardTitle>We&apos;re here to help</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              <p className="text-sm text-text-secondary">
                Have a question or need support? Contact our care team.
              </p>
              <div className="flex flex-wrap gap-2">
                <Link
                  href="/patient/messages"
                  className="inline-flex min-h-11 items-center gap-2 rounded-[var(--radius-lg)] border border-border bg-surface px-4 text-sm font-medium text-text-primary transition-all duration-200 ease-out hover:-translate-y-0.5 hover:shadow-card active:scale-[0.98] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-brand-blue)] motion-reduce:hover:translate-y-0 motion-reduce:active:scale-100"
                >
                  <ChatIconFilled className="h-4 w-4" aria-hidden="true" />
                  Contact clinic
                </Link>
                <a
                  href="tel:+15550100200"
                  className="inline-flex min-h-11 items-center gap-2 rounded-[var(--radius-lg)] border border-border bg-surface px-4 text-sm font-medium text-text-primary transition-all duration-200 ease-out hover:-translate-y-0.5 hover:shadow-card active:scale-[0.98] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-brand-blue)] motion-reduce:hover:translate-y-0 motion-reduce:active:scale-100"
                >
                  <PhoneIcon className="h-4 w-4" aria-hidden="true" />
                  Call the office
                </a>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <p className="animate-rise-in stagger-6 flex items-center justify-center gap-1.5 pb-1 text-xs text-text-secondary">
        <Lock className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
        Your information is secure and private.
      </p>
    </div>
  );
}
