import Link from "next/link";
import { CalendarX2 } from "lucide-react";
import { Avatar } from "@/components/ui/Avatar";
import { Badge, type BadgeTone } from "@/components/ui/Badge";
import {
  type SampleAppointment,
  type AppointmentStatus,
  getPatientById,
  patientFullName,
} from "@/lib/sample-data";

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

/** Today's visits across the whole practice, with per-patient check-in status — the receptionist's front-desk worklist. */
export function TodaysVisitsList({ appointments }: { appointments: SampleAppointment[] }) {
  const sorted = [...appointments].sort((a, b) => a.startTime.localeCompare(b.startTime));

  if (sorted.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 rounded-[var(--radius-lg)] border border-dashed border-border-strong py-12 text-center">
        <CalendarX2 className="h-8 w-8 text-text-secondary" aria-hidden="true" />
        <p className="text-sm font-medium text-text-primary">No visits scheduled today</p>
        <p className="max-w-xs text-xs text-text-secondary">
          Appointments booked for today will appear here as patients check in.
        </p>
      </div>
    );
  }

  return (
    <ul className="divide-y divide-border">
      {sorted.map((appt) => {
        const patient = getPatientById(appt.patientId);
        const time = new Date(appt.startTime).toLocaleTimeString("en-US", {
          hour: "numeric",
          minute: "2-digit",
        });
        return (
          <li key={appt.id} className="flex items-center gap-3 py-3">
            <div className="w-16 shrink-0 text-sm font-medium text-text-secondary">{time}</div>
            {patient && <Avatar name={patientFullName(patient)} src={patient.photoUrl} size="sm" />}
            <div className="min-w-0 flex-1">
              {patient ? (
                <Link
                  href={`/receptionist/patients/${patient.id}`}
                  className="truncate text-sm font-medium text-text-primary hover:text-[var(--color-brand-blue-text)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-brand-blue)] rounded-[var(--radius-sm)]"
                >
                  {patientFullName(patient)}
                </Link>
              ) : (
                <span className="text-sm font-medium text-text-primary">Unknown patient</span>
              )}
              <p className="truncate text-xs text-text-secondary">
                {appt.procedureType} · {appt.providerName}
              </p>
            </div>
            <Badge tone={STATUS_TONE[appt.status]}>{STATUS_LABEL[appt.status]}</Badge>
          </li>
        );
      })}
    </ul>
  );
}
