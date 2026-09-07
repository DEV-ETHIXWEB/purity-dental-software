import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { requireRole } from "@/lib/auth/authorize";
import { getPatientById } from "@/lib/data/patients";
import { patientFullName } from "@/lib/patient-format";
import { appointmentsForPatient } from "@/lib/data/appointments";
import { listInvoicesForPatient } from "@/lib/data/billing";
import { ReceptionistPatientProfileView } from "@/components/receptionist/ReceptionistPatientProfileView";

export async function generateMetadata({
  params,
}: PageProps<"/receptionist/patients/[patientId]">): Promise<Metadata> {
  const session = await requireRole(["RECEPTIONIST", "ADMIN"]);
  const { patientId } = await params;
  const patient = await getPatientById(session.user.organizationId, patientId);
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
  const session = await requireRole(["RECEPTIONIST", "ADMIN"]);
  const { patientId } = await params;
  const patient = await getPatientById(session.user.organizationId, patientId);
  if (!patient) notFound();

  const [appointments, invoices] = await Promise.all([
    appointmentsForPatient(session.user.organizationId, patient.id),
    listInvoicesForPatient(session.user.organizationId, patient.id),
  ]);

  return (
    <ReceptionistPatientProfileView patient={patient} appointments={appointments} invoices={invoices} />
  );
}
