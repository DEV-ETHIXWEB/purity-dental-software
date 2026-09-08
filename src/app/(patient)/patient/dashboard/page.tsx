import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { AppointmentCard } from "@/components/patient/AppointmentCard";
import { EmptyState } from "@/components/patient/EmptyState";
import { CalendarIconFilled, ChatIconFilled, SignatureIconFilled } from "@/components/ui/icons/purity-icons";
import { PhoneIcon, PrescriptionIcon, CheckmarkIcon, HeadsetIcon } from "@/components/ui/icons/purity-raster-icons";
import { TreatmentProgress } from "@/components/patient/TreatmentProgress";
import { requireRole } from "@/lib/auth/authorize";
import { getPatientForUser } from "@/lib/data/patients";
import { appointmentsForPatient } from "@/lib/data/appointments";
import { treatmentPlanForPatient } from "@/lib/data/treatment";

export const metadata: Metadata = {
  title: "Dashboard",
  description: "Your next visit, treatment progress, and quick links to your care.",
};

export default async function PatientDashboardPage() {
  const session = await requireRole(["PATIENT"]);
  const patient = await getPatientForUser(session.user.id);
  if (!patient) notFound();

  const now = new Date();
  const [myAppointments, myPlan] = await Promise.all([
    appointmentsForPatient(session.user.organizationId, patient.id),
    treatmentPlanForPatient(session.user.organizationId, patient.id),
  ]);

  const nextAppointment =
    myAppointments
      .filter((a) => a.startTime >= now && a.status !== "CANCELLED")
      .sort((a, b) => a.startTime.getTime() - b.startTime.getTime())[0] ?? null;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold text-text-primary">
          Hi {patient.firstName} — here&apos;s what&apos;s coming up
        </h1>
        <p className="text-sm text-text-secondary">
          A quick look at your next visit, your treatment, and anything that needs your attention.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Your next visit</CardTitle>
          </CardHeader>
          <CardContent>
            {nextAppointment ? (
              <AppointmentCard
                appointment={nextAppointment}
                action={
                  <Link
                    href="/patient/appointments"
                    className="inline-flex min-h-11 items-center justify-center rounded-[var(--radius-lg)] border border-border px-4 text-sm font-medium text-text-primary hover:bg-surface-muted focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-brand-blue)]"
                  >
                    View details
                  </Link>
                }
              />
            ) : (
              <EmptyState
                icon={CalendarIconFilled}
                title="No upcoming visits scheduled"
                description="When you're ready, booking a visit only takes a minute."
                action={
                  <Link
                    href="/patient/appointments"
                    className="cta-gradient-slide inline-flex min-h-11 items-center justify-center rounded-[var(--radius-lg)] px-4 text-sm font-medium text-white shadow-card focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-brand-blue)]"
                  >
                    Book an appointment
                  </Link>
                }
              />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="justify-start gap-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-surface-muted">
              <HeadsetIcon className="h-5 w-5" aria-hidden="true" />
            </span>
            <CardTitle>Need help?</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <p className="text-sm text-text-secondary">
              Have a question about your care or an upcoming visit? Your care team is here for you.
            </p>
            <Link
              href="/patient/messages"
              className="inline-flex min-h-11 items-center gap-2 rounded-[var(--radius-lg)] border border-border bg-surface-sunken px-4 text-sm font-medium text-text-primary hover:bg-border focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-brand-blue)]"
            >
              <ChatIconFilled className="h-4 w-4" aria-hidden="true" />
              Message your care team
            </Link>
            <a
              href="tel:+15550100200"
              className="inline-flex min-h-11 items-center gap-2 rounded-[var(--radius-lg)] border border-border px-4 text-sm font-medium text-text-primary hover:bg-surface-muted focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-brand-blue)]"
            >
              <PhoneIcon className="h-4 w-4" aria-hidden="true" />
              Call the office
            </a>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>How your treatment is going</CardTitle>
            <CardDescription>
              {myPlan.length > 0
                ? `${myPlan[0]?.procedure ?? "Your plan"} — step-by-step progress`
                : "No active treatment plan right now"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {myPlan.length > 0 ? (
              <TreatmentProgress items={myPlan} />
            ) : (
              <EmptyState
                icon={CheckmarkIcon}
                title="You're all caught up"
                description="There's no active treatment plan on file for you right now."
              />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Quick links</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <Link
              href="/patient/care"
              className="flex min-h-11 items-center justify-between gap-3 rounded-[var(--radius-lg)] border border-border p-4 text-sm hover:bg-surface-muted focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-brand-blue)]"
            >
              <span className="inline-flex items-center gap-2 font-medium text-text-primary">
                <SignatureIconFilled className="h-4 w-4" aria-hidden="true" />
                Forms to sign
              </span>
              <span className="text-text-secondary">My Care</span>
            </Link>
            <Link
              href="/patient/care"
              className="flex min-h-11 items-center justify-between gap-3 rounded-[var(--radius-lg)] border border-border p-4 text-sm hover:bg-surface-muted focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-brand-blue)]"
            >
              <span className="inline-flex items-center gap-2 font-medium text-text-primary">
                <PrescriptionIcon className="h-4 w-4" aria-hidden="true" />
                Prescriptions
              </span>
              <span className="text-text-secondary">My Care</span>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
