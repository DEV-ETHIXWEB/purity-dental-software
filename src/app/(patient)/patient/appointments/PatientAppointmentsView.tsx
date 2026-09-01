"use client";

import { useMemo, useState } from "react";
import { CalendarX2, History } from "lucide-react";
import { AppointmentCard } from "@/components/patient/AppointmentCard";
import { EmptyState } from "@/components/patient/EmptyState";
import { BookAppointmentFlow } from "@/components/patient/BookAppointmentFlow";
import { CancelAppointmentModal } from "@/components/patient/CancelAppointmentModal";
import { Button } from "@/components/ui/Button";
import {
  currentPatient,
  type SampleAppointment,
  type SampleOpenSlot,
} from "@/lib/sample-data";

const NOW = new Date("2026-08-24T12:00:00.000Z");
let bookedCounter = 0;

export function PatientAppointmentsView({ initialAppointments }: { initialAppointments: SampleAppointment[] }) {
  const [myAppointments, setMyAppointments] = useState(initialAppointments);
  const [cancelTarget, setCancelTarget] = useState<SampleAppointment | null>(null);

  const upcoming = useMemo(
    () =>
      myAppointments
        .filter((a) => new Date(a.startTime) >= NOW && a.status !== "CANCELLED" && a.status !== "COMPLETED")
        .sort((a, b) => a.startTime.localeCompare(b.startTime)),
    [myAppointments],
  );

  const past = useMemo(
    () =>
      myAppointments
        .filter((a) => a.status === "COMPLETED" || a.status === "CANCELLED" || a.status === "NO_SHOW")
        .sort((a, b) => b.startTime.localeCompare(a.startTime)),
    [myAppointments],
  );

  function handleBooked(slot: SampleOpenSlot, reason: string) {
    bookedCounter += 1;
    const newAppointment: SampleAppointment = {
      id: `appt_patient_new_${bookedCounter}`,
      patientId: currentPatient.id,
      providerId: "prov_dr_avery",
      providerName: slot.providerName,
      procedureType: reason,
      status: "SCHEDULED",
      startTime: slot.startTime,
      endTime: slot.endTime,
    };
    setMyAppointments((prev) => [...prev, newAppointment]);
  }

  function handleCancelConfirmed(appointmentId: string) {
    setMyAppointments((prev) =>
      prev.map((a) => (a.id === appointmentId ? { ...a, status: "CANCELLED" as const } : a)),
    );
    setCancelTarget(null);
  }

  return (
    <div className="flex flex-col gap-8">
      <BookAppointmentFlow onBooked={handleBooked} />

      <section aria-labelledby="upcoming-heading" className="flex flex-col gap-3">
        <h2 id="upcoming-heading" className="text-lg font-semibold text-text-primary">
          Your upcoming visits
        </h2>
        {upcoming.length > 0 ? (
          <ul className="flex flex-col gap-3">
            {upcoming.map((appointment) => (
              <li key={appointment.id}>
                <AppointmentCard
                  appointment={appointment}
                  action={
                    <Button
                      variant="outline"
                      size="sm"
                      className="min-h-11"
                      onClick={() => setCancelTarget(appointment)}
                    >
                      Cancel
                    </Button>
                  }
                />
              </li>
            ))}
          </ul>
        ) : (
          <EmptyState
            icon={CalendarX2}
            title="No upcoming visits"
            description="Use the booking form above whenever you're ready to schedule your next visit."
          />
        )}
      </section>

      <section aria-labelledby="past-heading" className="flex flex-col gap-3">
        <h2 id="past-heading" className="text-lg font-semibold text-text-primary">
          Past visits
        </h2>
        {past.length > 0 ? (
          <ul className="flex flex-col gap-3">
            {past.map((appointment) => (
              <li key={appointment.id}>
                <AppointmentCard appointment={appointment} />
              </li>
            ))}
          </ul>
        ) : (
          <EmptyState
            icon={History}
            title="No past visits yet"
            description="Your visit history will show up here after your first completed appointment."
          />
        )}
      </section>

      <CancelAppointmentModal
        appointment={cancelTarget}
        onClose={() => setCancelTarget(null)}
        onConfirm={handleCancelConfirmed}
      />
    </div>
  );
}
