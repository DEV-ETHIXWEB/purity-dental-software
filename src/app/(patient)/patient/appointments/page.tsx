import type { Metadata } from "next";
import { PatientAppointmentsView } from "./PatientAppointmentsView";
import { appointments, currentPatient } from "@/lib/sample-data";

export const metadata: Metadata = {
  title: "Appointments",
  description: "Book a new visit, see what's coming up, and review your visit history.",
};

export default function PatientAppointmentsPage() {
  const myAppointments = appointments.filter((a) => a.patientId === currentPatient.id);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold text-text-primary">Appointments</h1>
        <p className="text-sm text-text-secondary">
          Book a new visit, see what&apos;s coming up, and look back at past ones.
        </p>
      </div>

      <PatientAppointmentsView initialAppointments={myAppointments} />
    </div>
  );
}
