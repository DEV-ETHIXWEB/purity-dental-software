import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { FileText } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/Tabs";
import { PatientProfileHeader } from "@/components/dentist/PatientProfileHeader";
import { ContactDetailsCard } from "@/components/dentist/ContactDetailsCard";
import { BillingDetailsCard } from "@/components/dentist/BillingDetailsCard";
import { TreatmentPlanTable } from "@/components/dentist/TreatmentPlanTable";
import { PerioChartCard } from "@/components/dentist/PerioChartCard";
import { ToothChart } from "@/components/dentist/ToothChart";
import {
  getPatientById,
  patientFullName,
  patients,
  treatmentPlanForPatient,
  perioChartForPatient,
} from "@/lib/sample-data";

export function generateStaticParams() {
  return patients.map((p) => ({ patientId: p.id }));
}

export async function generateMetadata({
  params,
}: PageProps<"/hygienist/patients/[patientId]">): Promise<Metadata> {
  const { patientId } = await params;
  const patient = getPatientById(patientId);
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
  const { patientId } = await params;
  const patient = getPatientById(patientId);
  if (!patient) notFound();

  const treatmentPlan = treatmentPlanForPatient(patient.id);
  const perioEntry = perioChartForPatient(patient.id);

  return (
    <div className="flex flex-col gap-6">
      <PatientProfileHeader patient={patient} />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="flex flex-col gap-6 lg:col-span-1">
          <ContactDetailsCard patient={patient} />
          <BillingDetailsCard patient={patient} />

          <Card>
            <CardHeader>
              <CardTitle>Medical History</CardTitle>
            </CardHeader>
            <CardContent>
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
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-2">
          <Card>
            <CardContent>
              <Tabs defaultValue="treatment-plan">
                <TabsList>
                  <TabsTrigger value="treatment-plan">Treatment Plan</TabsTrigger>
                  <TabsTrigger value="perio-chart">Perio Chart</TabsTrigger>
                  <TabsTrigger value="documents">Documents</TabsTrigger>
                  <TabsTrigger value="tooth-chart">Tooth Chart</TabsTrigger>
                </TabsList>

                <TabsContent value="treatment-plan">
                  <TreatmentPlanTable items={treatmentPlan} />
                </TabsContent>

                <TabsContent value="perio-chart">
                  <PerioChartCard entry={perioEntry} />
                </TabsContent>

                <TabsContent value="documents">
                  <div className="flex flex-col items-center justify-center gap-2 rounded-[var(--radius-lg)] border border-dashed border-border-strong py-12 text-center">
                    <FileText className="h-8 w-8 text-text-secondary" aria-hidden="true" />
                    <p className="text-sm font-medium text-text-primary">No documents uploaded</p>
                    <p className="max-w-xs text-xs text-text-secondary">
                      X-rays, consent forms, and referral letters for {patientFullName(patient)} will
                      appear here once document upload is wired up.
                    </p>
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
