"use client";

import { useId, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { useClinicTimeZone } from "@/components/shell/ClinicTimeZone";
import { bookAppointment } from "@/lib/actions/book-appointment";
import {
  DEFAULT_PROCEDURE_MINUTES,
  DURATION_CHOICES,
  PROCEDURE_OPTIONS,
} from "@/lib/appointment-options";
import { clinicParts } from "@/lib/datetime";
import { patientFullName } from "@/lib/patient-format";
import type { Patient, User } from "@/generated/prisma/client";

const FIELD_CLASSES =
  "h-10 w-full rounded-[var(--radius-md)] border border-border bg-surface px-2.5 text-sm text-text-primary placeholder:text-text-secondary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-brand-blue)]";

export interface NewAppointmentModalProps {
  open: boolean;
  onClose: () => void;
  patients: Patient[];
  /** Clinicians this portal may book into. A single-entry list renders as fixed text. */
  providers: User[];
  /** Pre-selected provider — the signed-in clinician on their own schedule. */
  defaultProviderId?: string;
  /** Practice-local day the board is showing, as "YYYY-MM-DD". */
  defaultDate: string;
  /** Practice-local start time as "HH:MM", e.g. from a clicked empty slot. */
  defaultTime?: string;
}

/**
 * Wall-clock "2026-09-22T14:30" in `timeZone`, as a real instant.
 *
 * `new Date("2026-09-22T14:30")` would interpret those digits in the *viewer's*
 * zone, so a front-desk machine set to another region would book the visit at
 * the wrong moment. This measures the zone's offset at that date (so DST is
 * handled) and subtracts it.
 */
function instantFromClinicWallClock(date: string, time: string, timeZone: string): Date | null {
  const [y, m, d] = date.split("-").map(Number);
  const [hh, mm] = time.split(":").map(Number);
  if ([y, m, d, hh, mm].some((n) => !Number.isFinite(n))) return null;

  const guess = new Date(Date.UTC(y, m - 1, d, hh, mm));
  const parts = clinicParts(guess, timeZone);
  const asRenderedUtc = Date.UTC(parts.year, parts.month - 1, parts.day, parts.hour, parts.minute);
  return new Date(guess.getTime() - (asRenderedUtc - guess.getTime()));
}

/**
 * Staff-side booking. Backs the "New Appointment" / "Book Appointment" buttons
 * in all three staff portals, which until now only linked to a read-only day
 * board — see `lib/actions/book-appointment.ts`.
 */
export function NewAppointmentModal({
  open,
  onClose,
  patients,
  providers,
  defaultProviderId,
  defaultDate,
  defaultTime = "09:00",
}: NewAppointmentModalProps) {
  const router = useRouter();
  const timeZone = useClinicTimeZone();
  const ids = useId();

  const [patientId, setPatientId] = useState("");
  const [providerId, setProviderId] = useState(defaultProviderId ?? providers[0]?.id ?? "");
  const [procedureType, setProcedureType] = useState<string>(PROCEDURE_OPTIONS[0].value);
  const [date, setDate] = useState(defaultDate);
  const [time, setTime] = useState(defaultTime);
  const [minutes, setMinutes] = useState(String(PROCEDURE_OPTIONS[0].minutes));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /*
   * Reopening from a different slot should offer that slot, not whatever was
   * left in the fields last time. Adjusted during render on the open→closed
   * edge (React's documented pattern for deriving state from a prop change,
   * the same one `ui/Modal` uses) rather than in an effect, which would cost
   * an extra render and flash the stale values first.
   */
  const [wasOpen, setWasOpen] = useState(open);
  if (open !== wasOpen) {
    setWasOpen(open);
    if (open) {
      setDate(defaultDate);
      setTime(defaultTime);
      setError(null);
    }
  }

  const sortedPatients = useMemo(
    () => [...patients].sort((a, b) => patientFullName(a).localeCompare(patientFullName(b))),
    [patients],
  );

  function handleProcedureChange(value: string) {
    setProcedureType(value);
    const match = PROCEDURE_OPTIONS.find((p) => p.value === value);
    setMinutes(String(match?.minutes ?? DEFAULT_PROCEDURE_MINUTES));
  }

  async function handleSubmit() {
    if (busy) return;
    setError(null);

    if (!patientId) return setError("Choose a patient.");
    if (!providerId) return setError("Choose a provider.");

    const startTime = instantFromClinicWallClock(date, time, timeZone);
    if (!startTime) return setError("Choose a valid date and time.");

    setBusy(true);
    const result = await bookAppointment({
      patientId,
      providerId,
      startTime: startTime.toISOString(),
      durationMinutes: Number(minutes),
      procedureType,
    });
    setBusy(false);

    if (!result.ok) {
      setError(result.error ?? "Couldn't book this appointment.");
      return;
    }

    setPatientId("");
    onClose();
    router.refresh();
  }

  const soleProvider = providers.length === 1 ? providers[0] : null;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="New appointment"
      description="Book a visit into the practice schedule."
      footer={
        <div className="flex items-center justify-end gap-2">
          <Button variant="outline" onClick={onClose} disabled={busy}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={busy}>
            {busy ? "Booking…" : "Book appointment"}
          </Button>
        </div>
      }
    >
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <label htmlFor={`${ids}-patient`} className="text-sm font-medium text-text-primary">
            Patient
          </label>
          <select
            id={`${ids}-patient`}
            className={FIELD_CLASSES}
            value={patientId}
            onChange={(e) => setPatientId(e.target.value)}
          >
            <option value="">Select a patient…</option>
            {sortedPatients.map((p) => (
              <option key={p.id} value={p.id}>
                {patientFullName(p)}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor={`${ids}-provider`} className="text-sm font-medium text-text-primary">
            Provider
          </label>
          {soleProvider ? (
            <p
              id={`${ids}-provider`}
              className="flex h-10 items-center rounded-[var(--radius-md)] border border-border bg-surface-muted px-2.5 text-sm text-text-secondary"
            >
              {soleProvider.name}
            </p>
          ) : (
            <select
              id={`${ids}-provider`}
              className={FIELD_CLASSES}
              value={providerId}
              onChange={(e) => setProviderId(e.target.value)}
            >
              {providers.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          )}
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor={`${ids}-procedure`} className="text-sm font-medium text-text-primary">
            What&apos;s the visit for?
          </label>
          <select
            id={`${ids}-procedure`}
            className={FIELD_CLASSES}
            value={procedureType}
            onChange={(e) => handleProcedureChange(e.target.value)}
          >
            {PROCEDURE_OPTIONS.map((p) => (
              <option key={p.value} value={p.value}>
                {p.value}
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="flex flex-col gap-1.5">
            <label htmlFor={`${ids}-date`} className="text-sm font-medium text-text-primary">
              Date
            </label>
            <input
              id={`${ids}-date`}
              type="date"
              className={FIELD_CLASSES}
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label htmlFor={`${ids}-time`} className="text-sm font-medium text-text-primary">
              Start time
            </label>
            <input
              id={`${ids}-time`}
              type="time"
              step={300}
              className={FIELD_CLASSES}
              value={time}
              onChange={(e) => setTime(e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label htmlFor={`${ids}-minutes`} className="text-sm font-medium text-text-primary">
              Length
            </label>
            <select
              id={`${ids}-minutes`}
              className={FIELD_CLASSES}
              value={minutes}
              onChange={(e) => setMinutes(e.target.value)}
            >
              {DURATION_CHOICES.map((m) => (
                <option key={m} value={m}>
                  {m} min
                </option>
              ))}
            </select>
          </div>
        </div>

        <p className="text-xs text-text-secondary">
          Times are the practice&apos;s local clock.
        </p>

        <p aria-live="polite" className={error ? "text-sm text-error" : "sr-only"}>
          {error}
        </p>
      </div>
    </Modal>
  );
}
