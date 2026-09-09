import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Tabs, TabsList, TabsTrigger, TabsContent, TabLink } from "@/components/ui/Tabs";
import { PatientProfileHeader } from "@/components/dentist/PatientProfileHeader";
import { ContactDetailsCard } from "@/components/dentist/ContactDetailsCard";
import { BillingDetailsCard } from "@/components/dentist/BillingDetailsCard";
import { TreatmentPlanTable } from "@/components/dentist/TreatmentPlanTable";
import { PerioChartCard } from "@/components/dentist/PerioChartCard";
import { ToothChart } from "@/components/dentist/ToothChart";
import { PatientDocumentsPanel } from "@/components/dentist/PatientDocumentsPanel";
import { PatientPrescriptionsPanel } from "@/components/dentist/PatientPrescriptionsPanel";
import { PatientConsentFormsPanel } from "@/components/dentist/PatientConsentFormsPanel";
import { requirePageRole } from "@/lib/auth/require-portal";
import { getPatientById } from "@/lib/data/patients";
import { patientFullName } from "@/lib/patient-format";
import { treatmentPlanForPatient, perioChartForPatient } from "@/lib/data/treatment";
import { patientRecords } from "@/lib/data/clinical-records";

export async function generateMetadata({
  params,
}: PageProps<"/patients/[patientId]">): Promise<Metadata> {
  const session = await requirePageRole(["DENTIST", "ADMIN"]);
  const { patientId } = await params;
  const patient = await getPatientById(session.user.organizationId, patientId);
  return {
    title: patient ? patientFullName(patient) : "Patient not found",
    description: patient
      ? `Clinical profile, treatment plan, and billing details for ${patientFullName(patient)}.`
      : undefined,
  };
}

const PANEL_HEADING = "text-[15px] font-semibold tracking-tight text-text-primary";

export default async function PatientProfilePage({
  params,
}: PageProps<"/patients/[patientId]">) {
  const session = await requirePageRole(["DENTIST", "ADMIN"]);
  const { patientId } = await params;
  const patient = await getPatientById(session.user.organizationId, patientId);
  if (!patient) notFound();

  const [treatmentPlan, perioEntry, records] = await Promise.all([
    treatmentPlanForPatient(session.user.organizationId, patient.id),
    perioChartForPatient(session.user.organizationId, patient.id),
    patientRecords(session.user.organizationId, patient.id),
  ]);

  const medicalHistory = (
    <>
      {patient.medicalAlerts.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {patient.medicalAlerts.map((alert) => (
            <Badge
              key={alert}
              tone="error"
              className="transition-transform duration-200 ease-out hover:-translate-y-0.5 motion-reduce:hover:translate-y-0"
            >
              {alert}
            </Badge>
          ))}
        </div>
      ) : (
        <p className="text-sm text-text-secondary">No known alerts on file.</p>
      )}
      {/*
       * The Figma reference also lists Conditions and Medications here.
       * `Patient` records neither — there are no such columns — so rather
       * than invent "Hypertension / Amoxicillin 500mg" this says what the
       * record actually holds. Add the fields and this panel can grow.
       */}
      <p className="mt-4 text-xs leading-relaxed text-text-secondary">
        Conditions and medications aren&apos;t recorded on the patient record yet — allergies and
        alerts above are what&apos;s on file.
      </p>
    </>
  );

  return (
    <div className="flex flex-col gap-6">
      {/*
       * Identity, contact and billing read as one header band rather than a
       * stack of separate cards, matching the reference profile. Each is
       * still its own editable section — `divide-x` just makes the seams
       * read as columns instead of boxes.
       */}
      <Card className="animate-rise-in stagger-0 grid grid-cols-1 divide-y divide-border transition-shadow duration-300 ease-out hover:shadow-card-hover lg:grid-cols-3 lg:divide-x lg:divide-y-0">
        <PatientProfileHeader patient={patient} canLogTreatment variant="section" />
        <ContactDetailsCard patient={patient} canEdit />
        <BillingDetailsCard patient={patient} canEdit />
      </Card>

      <Card className="animate-rise-in stagger-1 transition-shadow duration-300 ease-out hover:shadow-card-hover">
        <CardContent>
          <Tabs defaultValue="overview">
            <TabsList>
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="medical-history">Medical History</TabsTrigger>
              <TabsTrigger value="treatment-plan">Treatment Plan</TabsTrigger>
              <TabsTrigger value="perio-chart">Perio Chart</TabsTrigger>
              <TabsTrigger value="documents">Docs &amp; Rx</TabsTrigger>
              <TabsTrigger value="tooth-chart">Tooth Chart</TabsTrigger>
            </TabsList>

            {/* Overview: the three things a clinician wants before picking up
                a handpiece, side by side, each linking through to its tab. */}
            <TabsContent value="overview" className="min-h-72">
              <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
                <section className="animate-rise-in stagger-1 flex flex-col gap-3">
                  <h3 className={PANEL_HEADING}>Medical History</h3>
                  <div>{medicalHistory}</div>
                </section>

                <section className="animate-rise-in stagger-2 flex flex-col gap-3 lg:col-span-2">
                  <div className="flex items-center justify-between gap-3">
                    <h3 className={PANEL_HEADING}>Treatment Plan</h3>
                    <TabLink
                      value="treatment-plan"
                      className="group/link inline-flex items-center gap-1.5 rounded-[var(--radius-sm)] text-sm font-medium text-[var(--color-brand-blue-text)] hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-brand-blue)]"
                    >
                      Open plan
                      <ArrowRight
                        className="h-3.5 w-3.5 transition-transform duration-200 ease-out group-hover/link:translate-x-1 motion-reduce:group-hover/link:translate-x-0"
                        aria-hidden="true"
                      />
                    </TabLink>
                  </div>
                  <TreatmentPlanTable items={treatmentPlan} />
                </section>

                <section className="animate-rise-in stagger-3 flex flex-col gap-3 lg:col-span-2">
                  <div className="flex items-center justify-between gap-3">
                    <h3 className={PANEL_HEADING}>Perio chart</h3>
                    <TabLink
                      value="documents"
                      className="rounded-[var(--radius-sm)] text-sm font-medium text-[var(--color-brand-blue-text)] hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-brand-blue)]"
                    >
                      {records.documents.length} docs · {records.prescriptions.length} Rx
                    </TabLink>
                  </div>
                  <PerioChartCard entry={perioEntry} />
                  <TabLink
                    value="perio-chart"
                    className="group/link inline-flex items-center gap-1.5 self-start rounded-[var(--radius-sm)] text-sm font-medium text-[var(--color-brand-blue-text)] hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-brand-blue)]"
                  >
                    Open perio chart
                    <ArrowRight
                      className="h-3.5 w-3.5 transition-transform duration-200 ease-out group-hover/link:translate-x-1 motion-reduce:group-hover/link:translate-x-0"
                      aria-hidden="true"
                    />
                  </TabLink>
                </section>
              </div>
            </TabsContent>

            <TabsContent value="medical-history" className="min-h-72">
              <div className="max-w-xl">{medicalHistory}</div>
            </TabsContent>

            <TabsContent value="treatment-plan" className="min-h-72">
              <TreatmentPlanTable items={treatmentPlan} />
            </TabsContent>

            <TabsContent value="perio-chart" className="min-h-72">
              <PerioChartCard entry={perioEntry} />
            </TabsContent>

            <TabsContent value="documents" className="min-h-72">
              <div className="flex flex-col gap-8">
                <PatientDocumentsPanel patientId={patient.id} documents={records.documents} />
                <PatientPrescriptionsPanel patientId={patient.id} prescriptions={records.prescriptions} />
                <PatientConsentFormsPanel patientId={patient.id} forms={records.consentForms} />
              </div>
            </TabsContent>

            <TabsContent value="tooth-chart" className="min-h-72">
              <ToothChart items={treatmentPlan} />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
