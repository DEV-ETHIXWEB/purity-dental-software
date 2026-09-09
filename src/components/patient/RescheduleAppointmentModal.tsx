"use client";

import { useMemo, useState } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { cn } from "@/lib/cn";
import { formatFriendlyDate, formatTime } from "./formatters";
import { reschedulePatientAppointment } from "@/lib/actions/patient-appointments";
import type { AppointmentWithPatientAndProvider } from "@/lib/data/appointments";

export interface RescheduleAppointmentModalProps {
  appointment: AppointmentWithPatientAndProvider | null;
  onClose: () => void;
  onRescheduled: () => void;
}

interface Slot {
  id: string;
  startTime: Date;
  endTime: Date;
}

/**
 * Offered times. Same synthetic weekday grid the booking flow uses — there's
 * still no provider-availability engine, and inventing a different set here
 * would let the two screens disagree about what's free.
 */
function generateSlots(durationMs: number): Slot[] {
  const slots: Slot[] = [];
  const now = new Date();
  let dayOffset = 1;
  while (slots.length < 6 && dayOffset < 21) {
    const day = new Date(now);
    day.setDate(day.getDate() + dayOffset);
    const dow = day.getDay();
    if (dow !== 0 && dow !== 6) {
      const hour = 9 + (slots.length % 6);
      const startTime = new Date(day);
      startTime.setHours(hour, 0, 0, 0);
      slots.push({
        id: `slot_${dayOffset}_${hour}`,
        startTime,
        endTime: new Date(startTime.getTime() + durationMs),
      });
    }
    dayOffset += 1;
  }
  return slots;
}

/** Move an existing visit to another time, keeping the same appointment record. */
export function RescheduleAppointmentModal({
  appointment,
  onClose,
  onRescheduled,
}: RescheduleAppointmentModalProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const durationMs = appointment
    ? Math.max(appointment.endTime.getTime() - appointment.startTime.getTime(), 30 * 60000)
    : 30 * 60000;

  const slots = useMemo(() => generateSlots(durationMs), [durationMs]);
  const selected = slots.find((s) => s.id === selectedId) ?? null;

  function close() {
    setSelectedId(null);
    setError(null);
    onClose();
  }

  async function handleConfirm() {
    if (!appointment || !selected || busy) return;
    setBusy(true);
    setError(null);
    const result = await reschedulePatientAppointment({
      appointmentId: appointment.id,
      startTime: selected.startTime.toISOString(),
      endTime: selected.endTime.toISOString(),
    });
    setBusy(false);
    if (result.ok) {
      setSelectedId(null);
      onRescheduled();
    } else {
      setError(result.error ?? "Couldn't move that appointment.");
    }
  }

  return (
    <Modal
      open={appointment !== null}
      onClose={close}
      title="Move this appointment"
      description={
        appointment
          ? `Currently ${formatFriendlyDate(appointment.startTime)} at ${formatTime(appointment.startTime)}`
          : undefined
      }
    >
      <div className="flex flex-col gap-4">
        <fieldset className="flex flex-col gap-2">
          <legend className="mb-1 text-sm font-medium text-text-primary">Pick a new time</legend>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {slots.map((slot) => {
              const active = slot.id === selectedId;
              return (
                <button
                  key={slot.id}
                  type="button"
                  onClick={() => setSelectedId(slot.id)}
                  aria-pressed={active}
                  className={cn(
                    "flex min-h-11 flex-col items-start rounded-[var(--radius-lg)] border px-3 py-2 text-left",
                    "transition-all duration-200 ease-out hover:-translate-y-0.5 hover:shadow-card active:scale-[0.98]",
                    "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-brand-blue)]",
                    "motion-reduce:hover:translate-y-0 motion-reduce:active:scale-100",
                    active
                      ? "border-[var(--color-brand-blue)] bg-info-bg"
                      : "border-border bg-surface hover:border-border-strong",
                  )}
                >
                  <span className="text-sm font-medium text-text-primary">
                    {formatFriendlyDate(slot.startTime)}
                  </span>
                  <span className="text-xs text-text-secondary">{formatTime(slot.startTime)}</span>
                </button>
              );
            })}
          </div>
        </fieldset>

        {error && (
          <p role="alert" className="animate-rise-in text-sm text-error">
            {error}
          </p>
        )}

        <div className="flex flex-wrap gap-2">
          <Button
            onClick={handleConfirm}
            disabled={!selected || busy}
            className="min-h-11 transition-all duration-200 ease-out hover:shadow-card-hover active:scale-[0.98] motion-reduce:active:scale-100"
          >
            {busy && <Loader2 className="h-4 w-4 animate-spin motion-reduce:animate-none" aria-hidden="true" />}
            {busy ? "Moving…" : "Confirm new time"}
          </Button>
          <Button variant="outline" onClick={close} className="min-h-11">
            Keep current time
          </Button>
        </div>
      </div>
    </Modal>
  );
}
