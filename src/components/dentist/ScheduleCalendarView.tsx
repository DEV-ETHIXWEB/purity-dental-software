"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { CalendarDays, ChevronLeft, ChevronRight } from "lucide-react";
import { Avatar } from "@/components/ui/Avatar";
import { Badge, type BadgeTone } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/cn";
import { addMonths, buildMonthGrid, dayKey, startOfMonth } from "@/lib/calendar";
import { clinicDayKey, clinicParts, formatClinicTime } from "@/lib/datetime";
import { useClinicTimeZone } from "@/components/shell/ClinicTimeZone";
import { patientFullName } from "@/lib/patient-format";
import type { AppointmentWithPatient } from "@/lib/data/appointments";
import type { AppointmentStatus } from "@/generated/prisma/client";
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

/**
 * Tint for the per-appointment chips inside a day cell. A day cell is far too
 * small for a Badge, but status still has to survive the shrink — otherwise a
 * cancelled visit and a confirmed one look identical on the month grid.
 * Static bracket classes, same CSP-safe approach as `ScheduleDayView`'s
 * left-accent borders.
 */
const CHIP_CLASS: Record<AppointmentStatus, string> = {
  SCHEDULED: "bg-info-bg text-info-text",
  CONFIRMED: "bg-info-bg text-[var(--color-brand-blue-text)]",
  CHECKED_IN: "bg-surface-muted text-[var(--color-brand-teal-text)]",
  IN_PROGRESS: "bg-warning-bg text-warning-text",
  COMPLETED: "bg-success-bg text-success-text",
  CANCELLED: "bg-surface-muted text-text-secondary line-through",
  NO_SHOW: "bg-error-bg text-error-text",
};

const WEEKDAYS = [
  { short: "Su", long: "Sunday" },
  { short: "Mo", long: "Monday" },
  { short: "Tu", long: "Tuesday" },
  { short: "We", long: "Wednesday" },
  { short: "Th", long: "Thursday" },
  { short: "Fr", long: "Friday" },
  { short: "Sa", long: "Saturday" },
];

/** "9AM", "2:30PM" — compact enough to sit inside a day cell. */
function timeShort(d: Date, timeZone: string) {
  return formatClinicTime(d, timeZone).replace(":00", "").replace(" ", "");
}

export interface ScheduleCalendarViewProps {
  /** Appointments already narrowed to this view's half of the timeline. */
  appointments: AppointmentWithPatient[];
  mode: "upcoming" | "past";
  /** Portal route prefix for patient profile links (e.g. "/hygienist"). */
  basePath?: string;
}

/**
 * Month calendar for a provider's own appointments — the "upcoming calendar"
 * and "past calendar" nodes of the site map. Both halves of the timeline get
 * the same grid; `mode` only decides which way the empty state and the
 * opening month lean.
 *
 * Navigation is local state rather than a URL param: the page already loads
 * the provider's full appointment history in one query, so paging a month
 * costs no server round trip.
 */
export function ScheduleCalendarView({ appointments, mode, basePath = "" }: ScheduleCalendarViewProps) {
  const timeZone = useClinicTimeZone();

  const byDay = useMemo(() => {
    const map = new Map<string, AppointmentWithPatient[]>();
    for (const appt of appointments) {
      const key = clinicDayKey(appt.startTime, timeZone);
      const list = map.get(key);
      if (list) list.push(appt);
      else map.set(key, [appt]);
    }
    for (const list of map.values()) {
      list.sort((a, b) => a.startTime.getTime() - b.startTime.getTime());
    }
    return map;
  }, [appointments, timeZone]);

  /**
   * Open on the month that actually has something in it — the nearest
   * upcoming visit, or the most recent past one. Opening on "today" would
   * show an empty grid whenever the next visit is a month or two out, and
   * leave the reader to hunt for it a month at a time.
   */
  const anchor = useMemo(() => {
    const now = new Date();
    if (appointments.length === 0) return now;
    const times = appointments.map((a) => a.startTime.getTime());
    const edge = new Date(mode === "upcoming" ? Math.min(...times) : Math.max(...times));
    // Rebuilt from practice-local parts so an appointment near a month
    // boundary opens the month the practice would call it.
    const { year, month, day } = clinicParts(edge, timeZone);
    return new Date(year, month - 1, day);
  }, [appointments, mode, timeZone]);

  const [monthCursor, setMonthCursor] = useState(() => startOfMonth(anchor));
  const [selectedKey, setSelectedKey] = useState<string | null>(() =>
    appointments.length > 0 ? dayKey(anchor) : null,
  );

  const weeks = useMemo(() => buildMonthGrid(monthCursor), [monthCursor]);
  const todayKey = clinicDayKey(new Date(), timeZone);

  const monthLabel = monthCursor.toLocaleDateString("en-US", { month: "long", year: "numeric" });
  const monthCount = useMemo(
    () =>
      appointments.filter((a) => {
        const { year, month } = clinicParts(a.startTime, timeZone);
        return year === monthCursor.getFullYear() && month - 1 === monthCursor.getMonth();
      }).length,
    [appointments, monthCursor, timeZone],
  );

  /*
   * The detail panel belongs to the grid above it. Page to another month and
   * a selection made in the old one would otherwise sit there unchanged —
   * a day's appointments captioned with a date nowhere on screen.
   */
  const monthPrefix = `${monthCursor.getFullYear()}-${String(monthCursor.getMonth() + 1).padStart(2, "0")}`;
  const visibleKey = selectedKey?.startsWith(monthPrefix) ? selectedKey : null;
  const selectedAppointments = visibleKey ? (byDay.get(visibleKey) ?? []) : [];
  const selectedLabel = visibleKey
    ? new Date(`${visibleKey}T00:00:00`).toLocaleDateString("en-US", {
        weekday: "long",
        month: "long",
        day: "numeric",
      })
    : null;

  if (appointments.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 rounded-[var(--radius-lg)] border border-dashed border-border px-6 py-12 text-center">
        <CalendarDays className="h-6 w-6 text-text-secondary" aria-hidden="true" />
        <p className="text-sm font-medium text-text-primary">
          {mode === "upcoming" ? "No upcoming appointments" : "No past visits yet"}
        </p>
        <p className="text-xs text-text-secondary">
          {mode === "upcoming"
            ? "Bookings made for you will appear on this calendar."
            : "Completed and missed visits will appear on this calendar."}
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-base font-semibold text-text-primary" aria-live="polite">
            {monthLabel}
          </h3>
          <p className="text-xs text-text-secondary">
            {monthCount} {monthCount === 1 ? "appointment" : "appointments"} this month
          </p>
        </div>
        <div className="flex items-center gap-1.5">
          <Button
            variant="outline"
            size="icon"
            onClick={() => setMonthCursor((m) => addMonths(m, -1))}
            aria-label="Previous month"
          >
            <ChevronLeft className="h-4 w-4" aria-hidden="true" />
          </Button>
          <Button variant="outline" size="sm" onClick={() => setMonthCursor(startOfMonth(new Date()))}>
            Today
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={() => setMonthCursor((m) => addMonths(m, 1))}
            aria-label="Next month"
          >
            <ChevronRight className="h-4 w-4" aria-hidden="true" />
          </Button>
        </div>
      </div>

      <table className="w-full table-fixed border-collapse" aria-label={`${monthLabel} appointment calendar`}>
        <thead>
          <tr>
            {WEEKDAYS.map((day) => (
              <th
                key={day.long}
                scope="col"
                className="px-1 pb-2 text-center text-[11px] font-medium text-text-secondary"
              >
                <span aria-hidden="true">{day.short}</span>
                <span className="sr-only">{day.long}</span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {weeks.map((week) => (
            <tr key={dayKey(week[0])}>
              {week.map((day) => {
                const key = dayKey(day);
                const dayAppointments = byDay.get(key) ?? [];
                const isCurrentMonth = day.getMonth() === monthCursor.getMonth();
                const isToday = key === todayKey;
                const isSelected = key === selectedKey;

                /*
                 * Only days with something on them are focusable. A month of
                 * 35 tab stops, most of them empty, is a keyboard trap in all
                 * but name — and an empty square has nothing to open.
                 */
                if (dayAppointments.length === 0) {
                  return (
                    <td key={key} className="border border-border p-0 align-top">
                      <div
                        aria-current={isToday ? "date" : undefined}
                        className={cn(
                          "flex h-full min-h-20 w-full flex-col p-1.5",
                          !isCurrentMonth && "opacity-45",
                        )}
                      >
                        <span
                          className={cn(
                            "self-start rounded-full px-1.5 text-xs leading-5",
                            isToday
                              ? "bg-[var(--color-brand-blue)] font-medium text-[var(--color-text-inverse)]"
                              : "text-text-secondary",
                          )}
                        >
                          {day.getDate()}
                        </span>
                      </div>
                    </td>
                  );
                }

                return (
                  <td key={key} className="border border-border p-0 align-top">
                    <button
                      type="button"
                      onClick={() => setSelectedKey(key)}
                      aria-pressed={isSelected}
                      aria-current={isToday ? "date" : undefined}
                      aria-label={`${day.toLocaleDateString("en-US", {
                        weekday: "long",
                        month: "long",
                        day: "numeric",
                      })}, ${dayAppointments.length} ${
                        dayAppointments.length === 1 ? "appointment" : "appointments"
                      }`}
                      className={cn(
                        "flex h-full min-h-20 w-full flex-col items-stretch gap-1 p-1.5 text-left",
                        "transition-colors duration-200 ease-out hover:bg-surface-muted",
                        "focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-[var(--color-brand-blue)]",
                        !isCurrentMonth && "opacity-45",
                        isSelected && "bg-info-bg/60 ring-2 ring-inset ring-[var(--color-brand-blue)]",
                      )}
                    >
                      <span
                        className={cn(
                          "self-start rounded-full px-1.5 text-xs font-medium leading-5",
                          isToday
                            ? "bg-[var(--color-brand-blue)] text-[var(--color-text-inverse)]"
                            : "text-text-primary",
                        )}
                      >
                        {day.getDate()}
                      </span>
                      {/*
                       * Seven columns on a 375px screen leaves ~50px a cell —
                       * a name chip there truncates to noise. Phones get a
                       * count pill instead; the day panel below carries the
                       * detail either way.
                       */}
                      <span
                        className={cn(
                          "self-start rounded-full px-1.5 text-[10px] font-medium leading-4 sm:hidden",
                          CHIP_CLASS[dayAppointments[0].status],
                        )}
                      >
                        {dayAppointments.length}
                      </span>

                      <span className="hidden flex-col gap-0.5 sm:flex">
                        {dayAppointments.slice(0, 2).map((appt) => (
                          <span
                            key={appt.id}
                            className={cn(
                              "truncate rounded-[var(--radius-sm)] px-1 py-0.5 text-[10px] leading-tight",
                              CHIP_CLASS[appt.status],
                            )}
                          >
                            {timeShort(appt.startTime, timeZone)} {appt.patient ? appt.patient.lastName : "Unknown"}
                          </span>
                        ))}
                        {dayAppointments.length > 2 && (
                          <span className="px-1 text-[10px] text-text-secondary">
                            +{dayAppointments.length - 2} more
                          </span>
                        )}
                      </span>
                    </button>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>

      {selectedLabel && (
        <div className="rounded-[var(--radius-lg)] border border-border bg-surface-muted/50 p-3">
          <h4 className="mb-2 text-sm font-semibold text-text-primary">{selectedLabel}</h4>
          {selectedAppointments.length === 0 ? (
            <p className="text-xs text-text-secondary">No appointments on this day.</p>
          ) : (
            <ul className="flex flex-col gap-2">
              {selectedAppointments.map((appt) => (
                <li
                  key={appt.id}
                  className="flex min-w-0 items-center justify-between gap-3 rounded-[var(--radius-md)] border border-border bg-surface px-3 py-2"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <span className="w-16 shrink-0 text-xs font-medium text-text-secondary">
                      {formatClinicTime(appt.startTime, timeZone)}
                    </span>
                    {appt.patient && (
                      <Avatar name={patientFullName(appt.patient)} src={appt.patient.photoUrl} size="sm" />
                    )}
                    <div className="min-w-0">
                      {appt.patient ? (
                        <Link
                          href={`${basePath}/patients/${appt.patient.id}`}
                          className="block truncate text-sm font-medium text-text-primary hover:text-[var(--color-brand-blue-text)] hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-brand-blue)]"
                        >
                          {patientFullName(appt.patient)}
                        </Link>
                      ) : (
                        <p className="truncate text-sm font-medium text-text-primary">Unknown patient</p>
                      )}
                      <p className="truncate text-xs text-text-secondary">{appt.procedureType}</p>
                    </div>
                  </div>
                  <Badge tone={isUnresolvedPastVisit(appt) ? "warning" : STATUS_TONE[appt.status]}>
                    {displayStatusLabel(appt, STATUS_LABEL)}
                  </Badge>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
