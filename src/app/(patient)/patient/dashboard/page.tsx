import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ChevronRight, Lock } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/patient/EmptyState";
import { TeethAtAGlance } from "@/components/patient/TeethAtAGlance";
import { QuickActions } from "@/components/patient/QuickActions";
import { NextAppointmentPanel } from "@/components/patient/NextAppointmentPanel";
import { BillingOverviewCard } from "@/components/patient/BillingOverviewCard";
import { ChatIconFilled } from "@/components/ui/icons/purity-icons";
import { PhoneIcon, CheckmarkIcon } from "@/components/ui/icons/purity-raster-icons";
import { TreatmentProgress } from "@/components/patient/TreatmentProgress";
import {
  greetingFor,
  formatHeroDate,
} from "@/components/patient/formatters";
import { requirePageRole } from "@/lib/auth/require-portal";
import { getPatientForUser } from "@/lib/data/patients";
import { getOrganization } from "@/lib/data/organization";
import { appointmentsForPatient } from "@/lib/data/appointments";
import { treatmentPlanForPatient } from "@/lib/data/treatment";
import { patientBillingOverview } from "@/lib/data/billing";
import { DEFAULT_CLINIC_TIMEZONE } from "@/lib/datetime";

export const metadata: Metadata = {
  title: "Dashboard",
  description: "Your next visit, treatment progress, balance and quick links to your care.",
};

export default async function PatientDashboardPage() {
  const session = await requirePageRole(["PATIENT"]);
  const patient = await getPatientForUser(session.user.id);
  if (!patient) notFound();

  const now = new Date();

  // Resolved first: the billing overview needs the practice's timezone to
  // decide what counts as overdue, so it can't share a Promise.all with the
  // query that fetches it.
  const organization = await getOrganization(session.user.organizationId);
  const timeZone = organization?.timezone ?? DEFAULT_CLINIC_TIMEZONE;

  const [myAppointments, myPlan, billing] = await Promise.all([
    appointmentsForPatient(session.user.organizationId, patient.id),
    treatmentPlanForPatient(session.user.organizationId, patient.id),
    patientBillingOverview(session.user.organizationId, patient.id, timeZone),
  ]);

  const nextAppointment =
    myAppointments
      .filter((a) => a.startTime >= now && a.status !== "CANCELLED")
      .sort((a, b) => a.startTime.getTime() - b.startTime.getTime())[0] ?? null;

  const practiceName = organization?.name ?? "your practice";

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

      {/*
        * One grid rather than two independent columns.
        *
        * Each row places a wide card (2 of 3) next to a narrow one, and grid
        * rows share a height, so the cards line up across the page instead of
        * each column drifting to its own rhythm. `items-stretch` (the default)
        * plus `h-full` on the cards is what makes both sides of a row meet at
        * the same baseline.
        *
        * Collapsing to one column on a phone gives the order a patient wants
        * anyway: what needs work, when they're next seen, what they can do,
        * what they owe.
        */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        {/* Replaces a decorative tooth photograph. The same arch the My Care
            page carries, so the first thing a patient sees is which of their
            own teeth have something happening — and the next-visit card that
            used to overlay the photo is gone, because the panel beside it
            already says exactly the same thing. */}
        <Card className="animate-rise-in stagger-1 flex h-full flex-col transition-shadow duration-300 ease-out hover:shadow-card-hover md:col-span-2">
          <CardHeader>
            <CardTitle>Your teeth at a glance</CardTitle>
            <Link
              href="/patient/care"
              className="touch-link group gap-1 rounded-[var(--radius-sm)] text-sm font-medium text-[var(--color-brand-blue-text)] transition-colors duration-200 ease-out hover:text-text-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-brand-blue)]"
            >
              View my care
              <ChevronRight
                className="h-4 w-4 transition-transform duration-200 ease-out group-hover:translate-x-0.5 motion-reduce:group-hover:translate-x-0"
                aria-hidden="true"
              />
            </Link>
          </CardHeader>
          <CardContent className="flex flex-1 items-center justify-center">
            <TeethAtAGlance items={myPlan} />
          </CardContent>
        </Card>

        <NextAppointmentPanel
          appointment={nextAppointment}
          practiceName={practiceName}
          timeZone={timeZone}
        />

        <QuickActions />

        {billing && (
        <section aria-labelledby="balance-heading" className="flex h-full flex-col gap-2">
              <div className="flex items-center justify-between gap-3">
                <h2
                  id="balance-heading"
                  className="text-[15px] font-semibold tracking-tight text-text-primary"
                >
                  My balance
                </h2>
                <Link
                  href="/patient/billing"
                  className="touch-link group gap-1 rounded-[var(--radius-sm)] text-sm font-medium text-[var(--color-brand-blue-text)] transition-colors duration-200 ease-out hover:text-text-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-brand-blue)]"
                >
                  View details
                  <ChevronRight
                    className="h-4 w-4 transition-transform duration-200 ease-out group-hover:translate-x-0.5 motion-reduce:group-hover:translate-x-0"
                    aria-hidden="true"
                  />
                </Link>
              </div>
              <BillingOverviewCard overview={billing} timeZone={timeZone} />
            </section>
          )}

        <Card className="animate-rise-in stagger-3 flex h-full flex-col transition-shadow duration-300 ease-out hover:shadow-card-hover md:col-span-2">
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


          {/* "We're here to help" — a brand-tinted panel rather than another
              plain card, so the one place to reach a human doesn't read as
              just more page furniture. */}
          <Card className="decor-radial-blue-teal animate-rise-in stagger-5 flex h-full flex-col transition-shadow duration-300 ease-out hover:shadow-card-hover">
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

      <p className="animate-rise-in stagger-6 flex items-center justify-center gap-1.5 pb-1 text-xs text-text-secondary">
        <Lock className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
        Your information is secure and private.
      </p>
    </div>
  );
}
