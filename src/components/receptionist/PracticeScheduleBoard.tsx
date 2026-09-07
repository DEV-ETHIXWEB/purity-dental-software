"use client";

import { useMemo, useState } from "react";
import { Card, CardContent } from "@/components/ui/Card";
import { Avatar } from "@/components/ui/Avatar";
import { Badge, type BadgeTone } from "@/components/ui/Badge";
import { cn } from "@/lib/cn";
import { patientFullName } from "@/lib/patient-format";
import type { AppointmentWithPatientAndProvider } from "@/lib/data/appointments";
import type { AppointmentStatus, User } from "@/generated/prisma/client";

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

const START_HOUR = 8;
const END_HOUR = 18;

function hourLabel(hour: number) {
  const period = hour >= 12 ? "PM" : "AM";
  const displayHour = hour % 12 === 0 ? 12 : hour % 12;
  return `${displayHour}:00 ${period}`;
}

function isSameDay(a: Date, b: Date) {
  return a.toDateString() === b.toDateString();
}

export interface PracticeScheduleBoardProps {
  date: Date;
  appointments: AppointmentWithPatientAndProvider[];
  providers: User[];
}

/**
 * Practice-wide appointment calendar, the key difference from the
 * Dentist/Hygienist "My Schedule" board: this shows every provider at once
 * with a provider filter, since the receptionist coordinates check-in and
 * booking across the whole practice rather than one provider's own day.
 */
export function PracticeScheduleBoard({ date, appointments, providers }: PracticeScheduleBoardProps) {
  const [providerFilter, setProviderFilter] = useState<string>("ALL");

  const filtered = useMemo(() => {
    if (providerFilter === "ALL") return appointments;
    return appointments.filter((a) => a.providerId === providerFilter);
  }, [appointments, providerFilter]);

  const hours = Array.from({ length: END_HOUR - START_HOUR + 1 }, (_, i) => START_HOUR + i);
  const dayLabel = date.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  const bookedByHour = new Map<number, AppointmentWithPatientAndProvider[]>();
  for (const appt of filtered) {
    const hour = appt.startTime.getHours();
    const list = bookedByHour.get(hour) ?? [];
    list.push(appt);
    bookedByHour.set(hour, list);
  }

  const now = new Date();
  const isToday = isSameDay(date, now);
  const currentHour = now.getHours();

  return (
    <Card>
      <CardContent>
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-base font-semibold text-text-primary">{dayLabel}</h2>
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
                  "rounded-[var(--radius-md)] px-3.5 py-1.5 text-sm font-medium transition-colors",
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
              <li key={hour} className="flex min-h-11 gap-4 py-1.5">
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
                      Open
                    </div>
                  ) : (
                    slotAppointments.map((appt) => {
                      const patient = appt.patient;
                      return (
                        <div
                          key={appt.id}
                          className={cn(
                            "flex min-w-0 flex-col gap-2 rounded-[var(--radius-md)] border border-l-[3px] border-border bg-surface-muted px-3 py-2 sm:flex-row sm:items-center sm:justify-between",
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
                          <Badge tone={STATUS_TONE[appt.status]}>{STATUS_LABEL[appt.status]}</Badge>
                        </div>
                      );
                    })
                  )}
                </div>
              </li>
            );
          })}
        </ol>
      </CardContent>
    </Card>
  );
}
