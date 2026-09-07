"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import type { Appointment, User } from "@/generated/prisma/client";
import { formatFriendlyDate, formatTime } from "./formatters";
import { cancelPatientAppointment } from "@/lib/actions/patient-appointments";

interface CancelAppointmentModalProps {
  appointment: (Appointment & { provider: Pick<User, "name"> }) | null;
  onClose: () => void;
  onConfirm: (appointmentId: string) => void;
}

/** Confirmation dialog before cancelling an upcoming appointment; persists via the real cancelPatientAppointment action. */
export function CancelAppointmentModal({ appointment, onClose, onConfirm }: CancelAppointmentModalProps) {
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
      title="Cancel this appointment?"
      description={
        appointment
          ? `${appointment.procedureType} on ${formatFriendlyDate(appointment.startTime)} at ${formatTime(appointment.startTime)}`
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
        <p className="text-sm text-text-secondary">
          This will remove it from your upcoming visits. If you change your mind, you can always book a new time.
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
