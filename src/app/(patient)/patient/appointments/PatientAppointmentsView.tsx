"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { CalendarIconFilled } from "@/components/ui/icons/purity-icons";
import { HistoryIcon } from "@/components/ui/icons/purity-raster-icons";
import { AppointmentCard } from "@/components/patient/AppointmentCard";
import { EmptyState } from "@/components/patient/EmptyState";
import { BookAppointmentFlow } from "@/components/patient/BookAppointmentFlow";
import { CancelAppointmentModal } from "@/components/patient/CancelAppointmentModal";
import { Button } from "@/components/ui/Button";
import type { AppointmentWithPatientAndProvider } from "@/lib/data/appointments";

export interface PatientAppointmentsViewProps {
  initialAppointments: AppointmentWithPatientAndProvider[];
  providerId: string;
  providerName: string;
}

export function PatientAppointmentsView({
  initialAppointments,
  providerId,
  providerName,
}: PatientAppointmentsViewProps) {
  const router = useRouter();
  const [cancelTarget, setCancelTarget] = useState<AppointmentWithPatientAndProvider | null>(null);

  const upcoming = useMemo(() => {
    const now = new Date();
    return initialAppointments
      .filter((a) => a.startTime >= now && a.status !== "CANCELLED" && a.status !== "COMPLETED")
      .sort((a, b) => a.startTime.getTime() - b.startTime.getTime());
  }, [initialAppointments]);

  const past = useMemo(
    () =>
      initialAppointments
        .filter((a) => a.status === "COMPLETED" || a.status === "CANCELLED" || a.status === "NO_SHOW")
        .sort((a, b) => b.startTime.getTime() - a.startTime.getTime()),
    [initialAppointments],
  );

  function handleCancelConfirmed() {
    setCancelTarget(null);
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-8">
      {providerId && (
        <BookAppointmentFlow
          providerId={providerId}
          providerName={providerName}
          onBooked={() => router.refresh()}
        />
      )}

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
            icon={CalendarIconFilled}
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
            icon={HistoryIcon}
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
