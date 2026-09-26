"use client";

import { useState } from "react";
import { Avatar } from "@/components/ui/Avatar";
import { Badge, type BadgeTone } from "@/components/ui/Badge";
import { cn } from "@/lib/cn";
import { patientFullName } from "@/lib/patient-format";
import type { AppointmentWithPatient } from "@/lib/data/appointments";
import type { AppointmentStatus } from "@/generated/prisma/client";
import { clinicDayKey, clinicHour, formatClinicDayLong } from "@/lib/datetime";
import { displayStatusLabel, isUnresolvedPastVisit } from "@/lib/appointment-status";
import {
  isSchedulePayload,
  readDragPayload,
  writeDragPayload,
} from "@/components/dentist/schedule-dnd";

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

const STAGGER = ["stagger-0", "stagger-1", "stagger-2", "stagger-3", "stagger-4", "stagger-5", "stagger-6", "stagger-7"];

/**
 * The working day the grid always shows. It is a floor and a ceiling, not a
 * filter: `visibleHours()` stretches past either end when something is
 * actually booked there. A fixed 8-18 window silently dropped a 7:30pm
 * emergency slot from the agenda and left the row reading "Open", which is
 * how you double-book a patient.
 */
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

export interface ScheduleDayViewProps {
  date: Date;
  appointments: AppointmentWithPatient[];
  /** The practice's timezone. Hour bucketing has to agree with it, or a visit lands in the wrong row. */
  timeZone: string;
  /** Book a waitlist entry into this exact hour. Omit to make the board read-only. */
  onDropWaitlist?: (waitlistEntryId: string, hour: number) => void;
  /** Move an appointment already on the board into this hour. Omit to pin appointments in place. */
  onMoveAppointment?: (appointmentId: string, hour: number) => void;
  /** A write is in flight — drops are refused until it settles. */
  busy?: boolean;
}

/**
 * Single-day agenda: hourly slots down the left, appointments within.
 *
 * Every hour is its own drop target, so a patient lands in the slot they were
 * dropped on rather than in whatever opening the board picked. Appointments
 * are draggable too, which is what makes a drop reversible — put someone in
 * the wrong hour and you drag them again.
 *
 * Drag-and-drop is an enhancement, never the only way through: native HTML5
 * dragging does not exist on touch and cannot be driven from a keyboard, so
 * each appointment also carries a "move to" time select that performs exactly
 * the same change.
 */
export function ScheduleDayView({
  date,
  appointments,
  timeZone,
  onDropWaitlist,
  onMoveAppointment,
  busy = false,
}: ScheduleDayViewProps) {
  const dayLabel = formatClinicDayLong(date, timeZone);
  const [dragHour, setDragHour] = useState<number | null>(null);
  const acceptsDrops = Boolean(onDropWaitlist || onMoveAppointment);

  const now = new Date();
  const isToday = clinicDayKey(date, timeZone) === clinicDayKey(now, timeZone);
  const currentHour = clinicHour(now, timeZone);

  const bookedByHour = new Map<number, AppointmentWithPatient[]>();
  for (const appt of appointments) {
    const hour = clinicHour(appt.startTime, timeZone);
    const list = bookedByHour.get(hour) ?? [];
    list.push(appt);
    bookedByHour.set(hour, list);
  }

  const hours = visibleHours([...bookedByHour.keys()]);

  return (
    <div>
      <h2 className="mb-4 text-base font-semibold text-text-primary">{dayLabel}</h2>
      <ol className="flex flex-col divide-y divide-border border-y border-border">
        {hours.map((hour) => {
          const slotAppointments = bookedByHour.get(hour) ?? [];
          const isNow = isToday && hour === currentHour;
          return (
            <li
              key={hour}
              onDragOver={
                acceptsDrops
                  ? (e) => {
                      // Only claim drags that came from this board; anything
                      // else must fall through to the browser's default.
                      if (busy || !isSchedulePayload(e.dataTransfer)) return;
                      e.preventDefault();
                      setDragHour(hour);
                    }
                  : undefined
              }
              onDragLeave={
                acceptsDrops
                  ? (e) => {
                      // Ignore the leave events fired while crossing this
                      // row's own children, or the highlight strobes.
                      if (e.currentTarget.contains(e.relatedTarget as Node | null)) return;
                      setDragHour((current) => (current === hour ? null : current));
                    }
                  : undefined
              }
              onDrop={
                acceptsDrops
                  ? (e) => {
                      e.preventDefault();
                      setDragHour(null);
                      if (busy) return;
                      const payload = readDragPayload(e.dataTransfer);
                      if (!payload) return;
                      if (payload.kind === "waitlist") onDropWaitlist?.(payload.id, hour);
                      else onMoveAppointment?.(payload.id, hour);
                    }
                  : undefined
              }
              className={cn(
                "animate-rise-in -mx-2 flex min-h-11 gap-4 rounded-[var(--radius-md)] px-2 py-1.5",
                "transition-colors duration-200 ease-out hover:bg-surface-muted/70",
                isNow && "bg-info-bg/40",
                dragHour === hour && "bg-info-bg ring-2 ring-inset ring-[var(--color-brand-blue)]",
                STAGGER[hour - hours[0]] ?? "stagger-7",
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
                  <div
                    className={cn(
                      "flex h-full min-h-8 items-center rounded-[var(--radius-sm)] border border-dashed border-border px-2 text-xs text-text-secondary/80",
                      "transition-colors duration-200 ease-out hover:border-[var(--color-brand-blue)]/50 hover:bg-info-bg/50 hover:text-[var(--color-brand-blue-text)]",
                    )}
                  >
                    {dragHour === hour ? "Drop here" : "Open"}
                  </div>
                ) : (
                  slotAppointments.map((appt) => {
                    const patient = appt.patient;
                    return (
                      <div
                        key={appt.id}
                        draggable={Boolean(onMoveAppointment) && !busy}
                        onDragStart={
                          onMoveAppointment
                            ? (e) => writeDragPayload(e.dataTransfer, { kind: "appointment", id: appt.id })
                            : undefined
                        }
                        onDragEnd={() => setDragHour(null)}
                        className={cn(
                          "group/appt flex min-w-0 items-center justify-between gap-3 rounded-[var(--radius-md)] border border-l-[3px] border-border bg-surface-muted px-3 py-2",
                          onMoveAppointment && !busy && "cursor-grab active:cursor-grabbing",
                          "transition-all duration-200 ease-out hover:-translate-y-0.5 hover:border-border-strong hover:bg-surface hover:shadow-card motion-reduce:hover:translate-y-0",
                          STATUS_ACCENT[appt.status],
                          appt.status === "IN_PROGRESS" &&
                            "bg-warning-bg/50 ring-1 ring-[var(--color-warning)]/35",
                        )}
                      >
                        <div className="flex min-w-0 items-center gap-3">
                          {patient && (
                            <Avatar
                              name={patientFullName(patient)}
                              src={patient.photoUrl}
                              size="sm"
                              className="transition-transform duration-200 ease-out group-hover/appt:-translate-y-0.5 motion-reduce:group-hover/appt:translate-y-0"
                            />
                          )}
                          <div className="min-w-0">
                            <p className="truncate text-sm font-medium text-text-primary">
                              {patient ? patientFullName(patient) : "Unknown patient"}
                            </p>
                            <p className="truncate text-xs text-text-secondary">{appt.procedureType}</p>
                          </div>
                        </div>
                        <div className="flex shrink-0 items-center gap-2">
                          <Badge tone={isUnresolvedPastVisit(appt) ? "warning" : STATUS_TONE[appt.status]}>
                            {displayStatusLabel(appt, STATUS_LABEL)}
                          </Badge>
                          {onMoveAppointment && (
                            /*
                             * The same move, reachable without a mouse.
                             * HTML5 drag-and-drop has no touch or keyboard
                             * equivalent, so a board that could only be
                             * rearranged by dragging would be unusable on a
                             * tablet at the chairside — which is most of them.
                             */
                            <select
                              aria-label={`Move ${patient ? patientFullName(patient) : "appointment"} to another time`}
                              value={hour}
                              disabled={busy}
                              onChange={(e) => onMoveAppointment(appt.id, Number(e.target.value))}
                              className="h-7 rounded-[var(--radius-sm)] border border-border bg-surface px-1 text-xs text-text-secondary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-brand-blue)]"
                            >
                              {hours.map((h) => (
                                <option key={h} value={h}>
                                  {hourLabel(h)}
                                </option>
                              ))}
                            </select>
                          )}
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
    </div>
  );
}
