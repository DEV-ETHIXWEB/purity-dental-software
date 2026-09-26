"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/Card";
import { Avatar } from "@/components/ui/Avatar";
import { Badge, type BadgeTone } from "@/components/ui/Badge";
import { cn } from "@/lib/cn";
import { patientFullName } from "@/lib/patient-format";
import type { AppointmentWithPatientAndProvider } from "@/lib/data/appointments";
import type { AppointmentStatus, User } from "@/generated/prisma/client";
import { clinicDayKey, clinicHour, formatClinicDayLong } from "@/lib/datetime";
import { useClinicTimeZone } from "@/components/shell/ClinicTimeZone";
import { NewAppointmentModal } from "@/components/dentist/NewAppointmentModal";
import { moveAppointment } from "@/lib/actions/move-appointment";
import { isSchedulePayload, readDragPayload, writeDragPayload } from "@/components/dentist/schedule-dnd";
import { clinicParts, instantFromClinicWallClock } from "@/lib/datetime";
import { NeedsAttentionPanel } from "@/components/dentist/NeedsAttentionPanel";
import { Button } from "@/components/ui/Button";
import type { Patient } from "@/generated/prisma/client";
import type { AppointmentWithPatient } from "@/lib/data/appointments";
import { displayStatusLabel, isUnresolvedPastVisit } from "@/lib/appointment-status";

const STATUS_LABEL: Record<AppointmentStatus, string> = {
  SCHEDULED: "Scheduled",
  CONFIRMED: "Confirmed",
  CHECKED_IN: "Checked In",
  IN_PROGRESS: "In Progress",
  COMPLETED: "Completed",
  CANCELLED: "Cancelled",
  NO_SHOW: "No Show",
};

const STATUS_TONE: Record<AppointmentStatus, BadgeTone> = {
  SCHEDULED: "info",
  CONFIRMED: "brand-blue",
  CHECKED_IN: "brand-teal",
  IN_PROGRESS: "warning",
  COMPLETED: "success",
  CANCELLED: "neutral",
  NO_SHOW: "error",
};

/** Left-accent border color per status, for at-a-glance scanning without reading the badge. Static bracket classes — CSP-safe (compiled, not inline). */
const STATUS_ACCENT: Record<AppointmentStatus, string> = {
  SCHEDULED: "border-l-[var(--color-info)]",
  CONFIRMED: "border-l-[var(--color-brand-blue)]",
  CHECKED_IN: "border-l-[var(--color-brand-teal)]",
  IN_PROGRESS: "border-l-[var(--color-warning)]",
  COMPLETED: "border-l-[var(--color-success)]",
  CANCELLED: "border-l-[var(--color-border-strong)]",
  NO_SHOW: "border-l-[var(--color-error)]",
};

/**
 * The working day the board always shows — a floor and a ceiling, not a
 * filter. `visibleHours()` stretches past either end for anything actually
 * booked there, so an out-of-hours visit can't vanish behind an "Open" row.
 */
const SELECT_CLASSES =
  "h-7 max-w-[8rem] rounded-[var(--radius-sm)] border border-border bg-surface px-1 text-xs text-text-secondary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-brand-blue)]";

const DEFAULT_START_HOUR = 8;
const DEFAULT_END_HOUR = 18;

function visibleHours(bookedHours: number[]): number[] {
  const first = Math.min(DEFAULT_START_HOUR, ...bookedHours);
  const last = Math.max(DEFAULT_END_HOUR, ...bookedHours);
  return Array.from({ length: last - first + 1 }, (_, i) => first + i);
}

function hourLabel(hour: number) {
  const period = hour >= 12 ? "PM" : "AM";
  const displayHour = hour % 12 === 0 ? 12 : hour % 12;
  return `${displayHour}:00 ${period}`;
}

export interface PracticeScheduleBoardProps {
  date: Date;
  appointments: AppointmentWithPatientAndProvider[];
  providers: User[];
  /** Everyone on the roster — the front desk books for any of them. */
  patients: Patient[];
  /** Past visits still in an open status, for the "Needs attention" queue. */
  unresolvedPast: AppointmentWithPatient[];
  /** Opens the booking dialog straight away (the dashboard's "Book Appointment" lands here with `?book=1`). */
  openBookingOnMount?: boolean;
}

/**
 * Practice-wide appointment calendar, the key difference from the
 * Dentist/Hygienist "My Schedule" board: this shows every provider at once
 * with a provider filter, since the receptionist coordinates check-in and
 * booking across the whole practice rather than one provider's own day.
 */
export function PracticeScheduleBoard({
  date,
  appointments,
  providers,
  patients,
  unresolvedPast,
  openBookingOnMount = false,
}: PracticeScheduleBoardProps) {
  const timeZone = useClinicTimeZone();
  const router = useRouter();
  const [bookingOpen, setBookingOpen] = useState(openBookingOnMount);
  const [dragHour, setDragHour] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<{ text: string; tone: "success" | "error" } | null>(null);

  /** The instant at which this board's day reads `hour:00` on the practice's clock. */
  function instantForHour(hour: number) {
    const { year, month, day } = clinicParts(date, timeZone);
    return instantFromClinicWallClock(year, month, day, hour, 0, timeZone);
  }

  /**
   * Moves a visit — to a different hour, a different clinician, or both.
   *
   * The front desk board is the one place that sees every provider at once,
   * so reassignment belongs here rather than on a clinician's own schedule.
   */
  async function move(appointmentId: string, hour: number, providerId?: string) {
    if (busy) return;
    setBusy(true);
    const result = await moveAppointment({
      appointmentId,
      startTime: instantForHour(hour).toISOString(),
      providerId,
    });
    setBusy(false);

    if (result.ok) {
      setNotice({ text: providerId ? "Appointment reassigned." : "Appointment moved.", tone: "success" });
      router.refresh();
    } else {
      setNotice({ text: result.error ?? "Couldn't move that appointment.", tone: "error" });
    }
  }
  const [providerFilter, setProviderFilter] = useState<string>("ALL");

  const filtered = useMemo(() => {
    if (providerFilter === "ALL") return appointments;
    return appointments.filter((a) => a.providerId === providerFilter);
  }, [appointments, providerFilter]);

  const dayLabel = formatClinicDayLong(date, timeZone);

  const bookedByHour = new Map<number, AppointmentWithPatientAndProvider[]>();
  for (const appt of filtered) {
    const hour = clinicHour(appt.startTime, timeZone);
    const list = bookedByHour.get(hour) ?? [];
    list.push(appt);
    bookedByHour.set(hour, list);
  }

  const hours = visibleHours([...bookedByHour.keys()]);

  const now = new Date();
  const isToday = clinicDayKey(date, timeZone) === clinicDayKey(now, timeZone);
  const currentHour = clinicHour(now, timeZone);

  return (
    <div className="flex flex-col gap-6">
      <NeedsAttentionPanel appointments={unresolvedPast} />

      <Card>
      <CardContent>
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap items-center gap-3">
            <h2 className="text-base font-semibold text-text-primary">{dayLabel}</h2>
            <Button size="sm" onClick={() => setBookingOpen(true)}>
              New appointment
            </Button>
          </div>
          <div role="tablist" aria-label="Filter schedule by provider" className="flex flex-wrap gap-2">
            <button
              type="button"
              role="tab"
              aria-selected={providerFilter === "ALL"}
              onClick={() => setProviderFilter("ALL")}
              className={cn(
                "rounded-[var(--radius-md)] px-3.5 py-1.5 text-sm font-medium transition-colors",
                "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-brand-blue)]",
                providerFilter === "ALL"
                  ? "bg-surface-sunken text-text-primary"
                  : "text-text-secondary hover:text-text-primary",
              )}
            >
              All Providers
            </button>
            {providers.map((provider) => (
              <button
                key={provider.id}
                type="button"
                role="tab"
                aria-selected={providerFilter === provider.id}
                onClick={() => setProviderFilter(provider.id)}
                className={cn(
                  // Hand-rolled tabs, so they miss `TabsTrigger`'s touch
                  // floor; `inline-flex` keeps the label centred once the
                  // 44px minimum kicks in on phones.
                  "inline-flex items-center justify-center rounded-[var(--radius-md)] px-3.5 py-1.5 text-sm font-medium transition-colors",
                  "min-h-11 sm:min-h-0",
                  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-brand-blue)]",
                  providerFilter === provider.id
                    ? "bg-surface-sunken text-text-primary"
                    : "text-text-secondary hover:text-text-primary",
                )}
              >
                {provider.name}
              </button>
            ))}
          </div>
        </div>

        <ol className="flex flex-col divide-y divide-border border-y border-border">
          {hours.map((hour) => {
            const slotAppointments = bookedByHour.get(hour) ?? [];
            const isNow = isToday && hour === currentHour;
            return (
              <li
                key={hour}
                onDragOver={(e) => {
                  // Only claim drags that started on this board.
                  if (busy || !isSchedulePayload(e.dataTransfer)) return;
                  e.preventDefault();
                  setDragHour(hour);
                }}
                onDragLeave={(e) => {
                  if (e.currentTarget.contains(e.relatedTarget as Node | null)) return;
                  setDragHour((current) => (current === hour ? null : current));
                }}
                onDrop={(e) => {
                  e.preventDefault();
                  setDragHour(null);
                  if (busy) return;
                  const payload = readDragPayload(e.dataTransfer);
                  if (payload?.kind === "appointment") void move(payload.id, hour);
                }}
                className={cn(
                  "-mx-2 flex min-h-11 gap-4 rounded-[var(--radius-md)] px-2 py-1.5 transition-colors duration-200 ease-out",
                  dragHour === hour && "bg-info-bg ring-2 ring-inset ring-[var(--color-brand-blue)]",
                )}
              >
                <span
                  className={cn(
                    "flex w-20 shrink-0 items-center gap-1.5 pt-1 text-xs font-medium",
                    isNow ? "text-[var(--color-brand-blue-text)]" : "text-text-secondary",
                  )}
                >
                  {isNow && <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--color-brand-blue)]" aria-hidden="true" />}
                  {hourLabel(hour)}
                </span>
                <div className="flex min-w-0 flex-1 flex-col gap-1.5">
                  {slotAppointments.length === 0 ? (
                    <div className="flex h-full min-h-8 items-center border-b border-dashed border-border px-1 text-xs text-text-secondary/80">
                      {dragHour === hour ? "Drop here" : "Open"}
                    </div>
                  ) : (
                    slotAppointments.map((appt) => {
                      const patient = appt.patient;
                      return (
                        <div
                          key={appt.id}
                          draggable={!busy}
                          onDragStart={(e) =>
                            writeDragPayload(e.dataTransfer, { kind: "appointment", id: appt.id })
                          }
                          onDragEnd={() => setDragHour(null)}
                          className={cn(
                            "flex min-w-0 flex-col gap-2 rounded-[var(--radius-md)] border border-l-[3px] border-border bg-surface-muted px-3 py-2 sm:flex-row sm:items-center sm:justify-between",
                            !busy && "cursor-grab active:cursor-grabbing",
                            STATUS_ACCENT[appt.status],
                          )}
                        >
                          <div className="flex min-w-0 items-center gap-3">
                            <Avatar name={patientFullName(patient)} src={patient.photoUrl} size="sm" />
                            <div className="min-w-0">
                              <p className="truncate text-sm font-medium text-text-primary">
                                {patientFullName(patient)}
                              </p>
                              <p className="truncate text-xs text-text-secondary">
                                {appt.procedureType} · {appt.provider.name}
                              </p>
                            </div>
                          </div>
                          <div className="flex shrink-0 flex-wrap items-center gap-2">
                            <Badge tone={isUnresolvedPastVisit(appt) ? "warning" : STATUS_TONE[appt.status]}>
                              {displayStatusLabel(appt, STATUS_LABEL)}
                            </Badge>

                            {/*
                             * The same two moves, without a mouse. HTML5
                             * dragging has no touch or keyboard equivalent,
                             * and the front desk works on a tablet as often
                             * as not.
                             */}
                            <select
                              aria-label={`Move ${patientFullName(patient)} to another time`}
                              value={hour}
                              disabled={busy}
                              onChange={(e) => void move(appt.id, Number(e.target.value))}
                              className={SELECT_CLASSES}
                            >
                              {hours.map((h) => (
                                <option key={h} value={h}>
                                  {hourLabel(h)}
                                </option>
                              ))}
                            </select>

                            <select
                              aria-label={`Reassign ${patientFullName(patient)} to another provider`}
                              value={appt.providerId}
                              disabled={busy}
                              onChange={(e) => void move(appt.id, hour, e.target.value)}
                              className={SELECT_CLASSES}
                            >
                              {providers.map((provider) => (
                                <option key={provider.id} value={provider.id}>
                                  {provider.name}
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </li>
            );
          })}
        </ol>

        <p
          aria-live="polite"
          className={cn(
            "mt-3 text-sm",
            !notice && "sr-only",
            notice?.tone === "error" ? "text-error" : "text-success-text",
          )}
        >
          {notice?.text}
        </p>
      </CardContent>
      </Card>

      <NewAppointmentModal
        open={bookingOpen}
        onClose={() => setBookingOpen(false)}
        patients={patients}
        providers={providers}
        defaultDate={clinicDayKey(date, timeZone)}
      />
    </div>
  );
}
