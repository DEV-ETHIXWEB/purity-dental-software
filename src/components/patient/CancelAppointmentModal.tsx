"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import type { Appointment, User } from "@/generated/prisma/client";
import { formatFriendlyDate, formatTime } from "./formatters";
import { cancelPatientAppointment } from "@/lib/actions/patient-appointments";
import { useClinicTimeZone } from "@/components/shell/ClinicTimeZone";

interface CancelAppointmentModalProps {
  appointment: (Appointment & { provider: Pick<User, "name"> }) | null;
  /**
   * Whether this visit is one whose time has passed while still open — the
   * "Missed visits" group. Passed in rather than derived from `Date.now()`
   * here: that is an impure read during render, and it could disagree with
   * the grouping the list has already shown the patient.
   */
  isMissed?: boolean;
  onClose: () => void;
  onConfirm: (appointmentId: string) => void;
}

/** Confirmation dialog before cancelling an upcoming appointment; persists via the real cancelPatientAppointment action. */
export function CancelAppointmentModal({
  appointment,
  isMissed = false,
  onClose,
  onConfirm,
}: CancelAppointmentModalProps) {
  const timeZone = useClinicTimeZone();
  const [cancelling, setCancelling] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleConfirm() {
    if (!appointment) return;
    setCancelling(true);
    setError(null);
    const result = await cancelPatientAppointment(appointment.id);
    setCancelling(false);
    if (result.ok) {
      onConfirm(appointment.id);
    } else {
      setError(result.error ?? "Something went wrong.");
    }
  }

  return (
    <Modal
      open={appointment !== null}
      onClose={onClose}
      title={isMissed ? "Clear this missed appointment?" : "Cancel this appointment?"}
      description={
        appointment
          ? `${appointment.procedureType} on ${formatFriendlyDate(appointment.startTime, timeZone)} at ${formatTime(appointment.startTime, timeZone)}`
          : undefined
      }
      footer={
        <>
          <Button variant="ghost" onClick={onClose} className="min-h-11">
            Keep appointment
          </Button>
          <Button variant="danger" onClick={handleConfirm} disabled={cancelling} className="min-h-11">
            {cancelling ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin motion-reduce:animate-none" aria-hidden="true" />
                Cancelling…
              </>
            ) : (
              "Yes, cancel it"
            )}
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-2">
        {/*
          * The copy follows the list the appointment is actually in. A visit
          * whose time has passed but was never resolved sits under "Missed
          * visits", not "Your upcoming visits", and telling someone it will
          * be removed from a list it was never in reads like the dialog is
          * about a different booking.
          */}
        <p className="text-sm text-text-secondary">
          {isMissed
            ? "This will clear it from your missed visits. If you still need this appointment, you can book a new time."
            : "This will remove it from your upcoming visits. If you change your mind, you can always book a new time."}
        </p>
        {error && (
          <p role="alert" className="text-sm text-error">
            {error}
          </p>
        )}
      </div>
    </Modal>
  );
}
