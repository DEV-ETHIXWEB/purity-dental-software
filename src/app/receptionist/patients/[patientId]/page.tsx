import type { Metadata } from "next";
import { getPatientById, patientFullName, patients } from "@/lib/sample-data";
import { ReceptionistPatientProfileView } from "@/components/receptionist/ReceptionistPatientProfileView";

export function generateStaticParams() {
  return patients.map((p) => ({ patientId: p.id }));
}

export async function generateMetadata({
  params,
}: PageProps<"/receptionist/patients/[patientId]">): Promise<Metadata> {
  const { patientId } = await params;
  const patient = getPatientById(patientId);
  return {
    title: patient ? patientFullName(patient) : "Patient",
    description: patient
      ? `Contact, billing, and appointment history for ${patientFullName(patient)}.`
      : "Patient profile.",
  };
}

export default async function ReceptionistPatientProfilePage({
  params,
}: PageProps<"/receptionist/patients/[patientId]">) {
  const { patientId } = await params;
  return <ReceptionistPatientProfileView patientId={patientId} />;
}
