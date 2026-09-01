import { Avatar } from "@/components/ui/Avatar";
import { Badge, type BadgeTone } from "@/components/ui/Badge";
import {
  type SampleAppointment,
  type AppointmentStatus,
  getPatientById,
  patientFullName,
} from "@/lib/sample-data";

const STATUS_TONE: Record<AppointmentStatus, BadgeTone> = {
  SCHEDULED: "info",
  CONFIRMED: "brand-blue",
  CHECKED_IN: "brand-teal",
  IN_PROGRESS: "warning",
  COMPLETED: "success",
  CANCELLED: "neutral",
  NO_SHOW: "error",
};

const START_HOUR = 8;
const END_HOUR = 18;

function hourLabel(hour: number) {
  const period = hour >= 12 ? "PM" : "AM";
  const displayHour = hour % 12 === 0 ? 12 : hour % 12;
  return `${displayHour}:00 ${period}`;
}

/** Single-day agenda: fixed hourly time slots down the left, appointments positioned within. */
export function ScheduleDayView({
  date,
  appointments,
}: {
  date: Date;
  appointments: SampleAppointment[];
}) {
  const hours = Array.from({ length: END_HOUR - START_HOUR + 1 }, (_, i) => START_HOUR + i);
  const dayLabel = date.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  const bookedByHour = new Map<number, SampleAppointment[]>();
  for (const appt of appointments) {
    const hour = new Date(appt.startTime).getHours();
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
          return (
            <li key={hour} className="flex min-h-[64px] gap-4 py-2">
              <span className="w-20 shrink-0 pt-1 text-xs font-medium text-text-secondary">
                {hourLabel(hour)}
              </span>
              <div className="flex flex-1 flex-col gap-2">
                {slotAppointments.length === 0 ? (
                  <div className="flex h-full items-center rounded-[var(--radius-md)] border border-dashed border-border px-3 py-2 text-xs text-text-secondary">
                    Open
                  </div>
                ) : (
                  slotAppointments.map((appt) => {
                    const patient = getPatientById(appt.patientId);
                    return (
                      <div
                        key={appt.id}
                        className="flex items-center justify-between gap-3 rounded-[var(--radius-md)] border border-border bg-surface-muted px-3 py-2"
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
