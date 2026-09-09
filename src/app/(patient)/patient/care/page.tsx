import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ChevronRight, Heart } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { EmptyState } from "@/components/patient/EmptyState";
import {
  ToothIconFilled,
  CrownIconFilled,
  DocumentIconFilled,
  ChatIconFilled,
  ClockSlotIconFilled,
} from "@/components/ui/icons/purity-icons";
import { PrescriptionIcon, PhoneIcon } from "@/components/ui/icons/purity-raster-icons";
import { TeethAtAGlance } from "@/components/patient/TeethAtAGlance";
import { ConsentFormsCard } from "@/components/patient/ConsentFormsCard";
import { PatientRecordsCard } from "@/components/patient/PatientRecordsCard";
import { TreatmentPlanCard } from "@/components/patient/TreatmentPlanCard";
import { SwitchDentistModal } from "@/components/patient/SwitchDentistModal";
import { requirePageRole } from "@/lib/auth/require-portal";
import { getPatientForUser } from "@/lib/data/patients";
import { treatmentPlanForPatient } from "@/lib/data/treatment";
import { appointmentsForPatient } from "@/lib/data/appointments";
import { patientRecords } from "@/lib/data/clinical-records";
import { listProviders } from "@/lib/data/providers";

export const metadata: Metadata = {
  title: "My Care",
  description: "Your oral health overview, treatment plan, forms and prescriptions.",
};

/** Same ordering the treatment stepper uses, so "step N of M" agrees across the app. */
const PLAN_ORDER = { COMPLETED: 1, ACTIVE: 2, PLANNED: 3, DECLINED: 4 } as const;

const QUICK_ACTIONS = [
  { href: "#prescriptions", label: "Prescriptions", Icon: PrescriptionIcon },
  { href: "#treatment-plan", label: "Records", Icon: DocumentIconFilled },
  { href: "/patient/appointments", label: "History", Icon: ClockSlotIconFilled },
];

const ROW_CLASSES =
  "group flex w-full items-center gap-3 rounded-[var(--radius-lg)] border border-border bg-surface p-4 text-left transition-all duration-200 ease-out hover:-translate-y-0.5 hover:border-border-strong hover:shadow-card active:scale-[0.99] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-brand-blue)] motion-reduce:hover:translate-y-0 motion-reduce:active:scale-100";

export default async function PatientCarePage() {
  const session = await requirePageRole(["PATIENT"]);
  const patient = await getPatientForUser(session.user.id);
  if (!patient) notFound();

  const [plan, providers, appointments, records] = await Promise.all([
    treatmentPlanForPatient(session.user.organizationId, patient.id),
    listProviders(session.user.organizationId),
    appointmentsForPatient(session.user.organizationId, patient.id),
    patientRecords(session.user.organizationId, patient.id),
  ]);

  // The clinician this patient actually sees, taken from their most recent
  // booking. `providers[0]` would just be whoever sorts first by name across
  // the whole practice — which is how this panel came to announce a
  // hygienist as the patient's dentist.
  const seenProvider = [...appointments]
    .filter((a) => a.status !== "CANCELLED")
    .sort((a, b) => b.startTime.getTime() - a.startTime.getTime())[0]?.provider;
  const currentProvider =
    (seenProvider && providers.find((p) => p.id === seenProvider.id)) ??
    providers.find((p) => p.role === "DENTIST") ??
    providers[0] ??
    null;
  const alternateProviders = providers.filter((p) => p.id !== currentProvider?.id);

  const openPlanItems = [...plan]
    .filter((i) => i.status !== "DECLINED")
    .sort((a, b) => PLAN_ORDER[a.status] - PLAN_ORDER[b.status]);
  const planTitle = Array.from(new Set(openPlanItems.map((i) => i.procedure))).join(" + ");
  const activeItem = openPlanItems.find((i) => i.status === "ACTIVE");
  const completedCount = openPlanItems.filter((i) => i.status === "COMPLETED").length;
  const currentStep = activeItem ? completedCount + 1 : completedCount;
  const progressPct =
    openPlanItems.length > 0 ? Math.round((currentStep / openPlanItems.length) * 100) : 0;
  const progressStep = Math.max(progressPct > 0 ? 5 : 0, Math.round(progressPct / 5) * 5);

  const needsAttention = openPlanItems.filter(
    (i) => i.status === "ACTIVE" || i.status === "PLANNED",
  ).length;

  return (
    <div className="flex flex-col gap-6">
      <div className="animate-rise-in stagger-0">
        <h1 className="text-2xl font-semibold tracking-tight text-text-primary">My Care</h1>
        <p className="text-sm text-text-secondary">Your oral health overview and care details.</p>
      </div>

      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-3">
        <div className="flex flex-col gap-6 lg:col-span-2">
          <Card className="animate-rise-in stagger-1 transition-shadow duration-300 ease-out hover:shadow-card-hover">
            <CardHeader>
              <CardTitle>Your teeth at a glance</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 gap-5 sm:grid-cols-[1fr_auto] sm:items-center">
              <TeethAtAGlance items={plan} />

              {/* Encouragement panel — its copy is driven by the same plan
                  data as the arch, so it can't cheerfully contradict a mouth
                  full of open treatment. */}
              <div className="decor-radial-blue-teal flex flex-col items-center gap-2 rounded-[var(--radius-xl)] border border-border p-4 text-center sm:w-44">
                <span className="flex h-11 w-11 items-center justify-center rounded-full bg-surface shadow-card">
                  <Heart
                    className="h-5 w-5 text-[var(--color-brand-blue-text)]"
                    aria-hidden="true"
                  />
                </span>
                <p className="text-sm font-semibold text-text-primary">
                  {needsAttention === 0 ? "You're doing great!" : "A few things to do"}
                </p>
                <p className="text-xs leading-relaxed text-text-secondary">
                  {needsAttention === 0
                    ? "Keep up your oral care routine."
                    : `${needsAttention} ${needsAttention === 1 ? "tooth needs" : "teeth need"} attention. Your dentist has a plan in place.`}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="animate-rise-in stagger-2 transition-shadow duration-300 ease-out hover:shadow-card-hover">
            <CardHeader>
              <CardTitle>Quick actions</CardTitle>
            </CardHeader>
            <CardContent className="pt-3">
              <ul className="grid grid-cols-3 gap-2.5">
                {QUICK_ACTIONS.map(({ href, label, Icon }) => (
                  <li key={label}>
                    <Link
                      href={href}
                      className="group flex h-full min-h-11 flex-col items-center justify-center gap-1.5 rounded-[var(--radius-lg)] border border-border px-2 py-3 text-center transition-all duration-200 ease-out hover:-translate-y-0.5 hover:border-border-strong hover:bg-surface-muted hover:shadow-card active:scale-[0.97] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-brand-blue)] motion-reduce:hover:translate-y-0 motion-reduce:active:scale-100"
                    >
                      <Icon
                        className="h-5 w-5 shrink-0 transition-transform duration-200 ease-out group-hover:scale-110 motion-reduce:group-hover:scale-100"
                        aria-hidden="true"
                      />
                      <span className="text-xs font-medium leading-snug text-text-primary">
                        {label}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          {openPlanItems.length > 0 && (
            <Link href="#treatment-plan" className={ROW_CLASSES}>
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-info-bg">
                <ToothIconFilled className="h-5 w-5" aria-hidden="true" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-xs font-medium text-text-secondary">
                  Treatment overview
                </span>
                <span className="block text-base font-semibold leading-snug text-text-primary">
                  {planTitle}
                </span>
                <span className="block truncate text-xs text-text-secondary">
                  {activeItem ? `Current step: ${activeItem.procedure}` : "No step in progress"}
                </span>
                <span className="mt-2 flex items-center gap-3">
                  <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-surface-sunken">
                    <span
                      className={`meter-fill block h-full rounded-full meter-fill-${progressStep}`}
                    />
                  </span>
                  <span className="shrink-0 text-xs text-text-secondary">
                    Step {currentStep} of {openPlanItems.length}
                  </span>
                </span>
              </span>
              <ChevronRight
                className="h-5 w-5 shrink-0 text-text-secondary transition-transform duration-200 ease-out group-hover:translate-x-0.5 motion-reduce:group-hover:translate-x-0"
                aria-hidden="true"
              />
            </Link>
          )}

          <section id="treatment-plan" className="flex scroll-mt-4 flex-col gap-3">
            <h2 className="text-[15px] font-semibold tracking-tight text-text-primary">
              Your treatment plan
            </h2>
            {plan.length > 0 ? (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {plan.map((item) => (
                  <TreatmentPlanCard key={item.id} item={item} />
                ))}
              </div>
            ) : (
              <EmptyState
                icon={CrownIconFilled}
                title="No treatment plan on file"
                description="When your provider puts together a plan, it will show up here."
              />
            )}
          </section>
        </div>

        <div className="flex flex-col gap-6">
          <section id="forms" className="flex scroll-mt-4 flex-col gap-3">
            <h2 className="text-[15px] font-semibold tracking-tight text-text-primary">
              Forms to sign
            </h2>
            <ConsentFormsCard forms={records.consentForms} />
          </section>

          <section id="prescriptions" className="flex scroll-mt-4 flex-col gap-3">
            <h2 className="text-[15px] font-semibold tracking-tight text-text-primary">
              Prescriptions &amp; records
            </h2>
            <PatientRecordsCard
              prescriptions={records.prescriptions}
              documents={records.documents}
            />
          </section>

          {currentProvider && (
            <Card className="animate-rise-in stagger-4 transition-shadow duration-300 ease-out hover:shadow-card-hover">
              {/* Wraps rather than squeezing: this card lives in the narrow
                  third column, where the icon, copy and button together are
                  wider than the row. `basis-40` gives the text a floor so it
                  pushes the button onto its own line instead of collapsing
                  to one word per line. */}
              <CardContent className="flex flex-wrap items-center gap-3">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-surface-muted">
                  <ToothIconFilled className="h-5 w-5" aria-hidden="true" />
                </span>
                <div className="min-w-0 flex-1 basis-40">
                  <p className="text-xs font-medium text-text-secondary">Your care team</p>
                  <p className="text-xs text-text-secondary">You are currently under the care of</p>
                  <p className="truncate text-sm font-semibold text-text-primary">
                    {currentProvider.name}
                  </p>
                </div>
                <SwitchDentistModal
                  patientId={patient.id}
                  currentProviderName={currentProvider.name}
                  alternateProviders={alternateProviders}
                />
              </CardContent>
            </Card>
          )}

          <Card className="decor-radial-blue-teal animate-rise-in stagger-5 transition-shadow duration-300 ease-out hover:shadow-card-hover">
            <CardHeader className="justify-start gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-surface shadow-card">
                <ChatIconFilled className="h-5 w-5" aria-hidden="true" />
              </span>
              <CardTitle>Need help?</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              <p className="text-sm text-text-secondary">
                Contact our care team, we&apos;re here to help you.
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
    </div>
  );
}
