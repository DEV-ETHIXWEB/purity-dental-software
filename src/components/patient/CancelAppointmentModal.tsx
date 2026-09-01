"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import type { SampleAppointment } from "@/lib/sample-data";
import { formatFriendlyDate, formatTime } from "./formatters";

interface CancelAppointmentModalProps {
  appointment: SampleAppointment | null;
  onClose: () => void;
  onConfirm: (appointmentId: string) => void;
}

/** Confirmation dialog before cancelling an upcoming appointment; updates local list state on confirm, no real persistence. */
export function CancelAppointmentModal({ appointment, onClose, onConfirm }: CancelAppointmentModalProps) {
  const [cancelling, setCancelling] = useState(false);

  function handleConfirm() {
    if (!appointment) return;
    setCancelling(true);
    window.setTimeout(() => {
      setCancelling(false);
      onConfirm(appointment.id);
    }, 500);
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
      <p className="text-sm text-text-secondary">
        This will remove it from your upcoming visits. If you change your mind, you can always book a new time.
      </p>
    </Modal>
  );
}
