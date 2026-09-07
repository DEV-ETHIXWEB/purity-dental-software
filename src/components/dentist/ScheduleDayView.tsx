import { Avatar } from "@/components/ui/Avatar";
import { Badge, type BadgeTone } from "@/components/ui/Badge";
import { cn } from "@/lib/cn";
import { patientFullName } from "@/lib/patient-format";
import type { AppointmentWithPatient } from "@/lib/data/appointments";
import type { AppointmentStatus } from "@/generated/prisma/client";

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

/** Single-day agenda: fixed hourly time slots down the left, appointments positioned within. */
export function ScheduleDayView({
  date,
  appointments,
}: {
  date: Date;
  appointments: AppointmentWithPatient[];
}) {
  const hours = Array.from({ length: END_HOUR - START_HOUR + 1 }, (_, i) => START_HOUR + i);
  const dayLabel = date.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  const now = new Date();
  const isToday = isSameDay(date, now);
  const currentHour = now.getHours();

  const bookedByHour = new Map<number, AppointmentWithPatient[]>();
  for (const appt of appointments) {
    const hour = appt.startTime.getHours();
    const list = bookedByHour.get(hour) ?? [];
    list.push(appt);
    bookedByHour.set(hour, list);
  }

  return (
    <div>
      <h2 className="mb-4 text-base font-semibold text-text-primary">{dayLabel}</h2>
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
                          "flex min-w-0 items-center justify-between gap-3 rounded-[var(--radius-md)] border border-l-[3px] border-border bg-surface-muted px-3 py-2",
                          STATUS_ACCENT[appt.status],
                        )}
                      >
                        <div className="flex min-w-0 items-center gap-3">
                          {patient && (
                            <Avatar name={patientFullName(patient)} src={patient.photoUrl} size="sm" />
                          )}
                          <div className="min-w-0">
                            <p className="truncate text-sm font-medium text-text-primary">
                              {patient ? patientFullName(patient) : "Unknown patient"}
                            </p>
                            <p className="truncate text-xs text-text-secondary">{appt.procedureType}</p>
                          </div>
                        </div>
                        <Badge tone={STATUS_TONE[appt.status]}>
                          {appt.status.replace("_", " ").toLowerCase().replace(/^\w/, (c) => c.toUpperCase())}
                        </Badge>
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
