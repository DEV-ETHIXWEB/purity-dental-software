import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PatientAppointmentsView } from "./PatientAppointmentsView";
import { requirePageRole } from "@/lib/auth/require-portal";
import { getPatientForUser } from "@/lib/data/patients";
import { appointmentsForPatient } from "@/lib/data/appointments";
import { listProviders } from "@/lib/data/providers";

export const metadata: Metadata = {
  title: "Appointments",
  description: "Book a new visit, see what's coming up, and review your visit history.",
};

export default async function PatientAppointmentsPage() {
  const session = await requirePageRole(["PATIENT"]);
  const patient = await getPatientForUser(session.user.id);
  if (!patient) notFound();

  const [myAppointments, providers] = await Promise.all([
    appointmentsForPatient(session.user.organizationId, patient.id),
    listProviders(session.user.organizationId),
  ]);
  const provider = providers[0] ?? null;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold text-text-primary">Appointments</h1>
        <p className="text-sm text-text-secondary">
          Book a new visit, see what&apos;s coming up, and look back at past ones.
        </p>
      </div>

      <PatientAppointmentsView
        initialAppointments={myAppointments}
        providerId={provider?.id ?? ""}
        providerName={provider?.name ?? "your provider"}
      />
    </div>
  );
}
