import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Card, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/Tabs";
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
}: PageProps<"/hygienist/patients/[patientId]">): Promise<Metadata> {
  const session = await requirePageRole(["HYGIENIST", "ADMIN"]);
  const { patientId } = await params;
  const patient = await getPatientById(session.user.organizationId, patientId);
  return {
    title: patient ? patientFullName(patient) : "Patient not found",
    description: patient
      ? `Clinical profile, treatment plan, and billing details for ${patientFullName(patient)}.`
      : undefined,
  };
}

export default async function HygienistPatientProfilePage({
  params,
}: PageProps<"/hygienist/patients/[patientId]">) {
  const session = await requirePageRole(["HYGIENIST", "ADMIN"]);
  const { patientId } = await params;
  const patient = await getPatientById(session.user.organizationId, patientId);
  if (!patient) notFound();

  const [treatmentPlan, perioEntry, records] = await Promise.all([
    treatmentPlanForPatient(session.user.organizationId, patient.id),
    perioChartForPatient(session.user.organizationId, patient.id),
    patientRecords(session.user.organizationId, patient.id),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <PatientProfileHeader patient={patient} canLogTreatment />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-1">
          <Card className="divide-y divide-border">
            <ContactDetailsCard patient={patient} canEdit />
            <BillingDetailsCard patient={patient} canEdit />
            <section className="p-4">
              <h3 className="text-[15px] font-semibold tracking-tight text-text-primary">Medical History</h3>
              <div className="mt-3">
                {patient.medicalAlerts.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {patient.medicalAlerts.map((alert) => (
                      <Badge key={alert} tone="error">
                        {alert}
                      </Badge>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-text-secondary">No known alerts on file.</p>
                )}
              </div>
            </section>
          </Card>
        </div>

        <div className="lg:col-span-2">
          <Card>
            <CardContent>
              <Tabs defaultValue="treatment-plan">
                <TabsList>
                  <TabsTrigger value="treatment-plan">Treatment Plan</TabsTrigger>
                  <TabsTrigger value="perio-chart">Perio Chart</TabsTrigger>
                  <TabsTrigger value="documents">Docs &amp; Rx</TabsTrigger>
                  <TabsTrigger value="tooth-chart">Tooth Chart</TabsTrigger>
                </TabsList>

                <TabsContent value="treatment-plan">
                  <TreatmentPlanTable items={treatmentPlan} />
                </TabsContent>

                <TabsContent value="perio-chart">
                  <PerioChartCard entry={perioEntry} />
                </TabsContent>

                <TabsContent value="documents">
                  <div className="flex flex-col gap-8">
                    <PatientDocumentsPanel patientId={patient.id} documents={records.documents} />
                    <PatientPrescriptionsPanel patientId={patient.id} prescriptions={records.prescriptions} />
                    <PatientConsentFormsPanel patientId={patient.id} forms={records.consentForms} />
                  </div>
                </TabsContent>

                <TabsContent value="tooth-chart">
                  <ToothChart items={treatmentPlan} />
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
