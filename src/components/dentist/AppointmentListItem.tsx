import Link from "next/link";
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

export interface AppointmentListItemProps {
  appointment: SampleAppointment;
  /** Portal route prefix for the patient profile link (e.g. "/hygienist"). Defaults to the Dentist portal's root. */
  basePath?: string;
}

export function AppointmentListItem({ appointment, basePath = "" }: AppointmentListItemProps) {
  const patient = getPatientById(appointment.patientId);
  const time = new Date(appointment.startTime).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });

  return (
    <li className="flex items-center gap-3 py-3">
      <div className="w-16 shrink-0 text-sm font-medium text-text-secondary">{time}</div>
      {patient && <Avatar name={patientFullName(patient)} src={patient.photoUrl} size="sm" />}
      <div className="min-w-0 flex-1">
        {patient ? (
          <Link
            href={`${basePath}/patients/${patient.id}`}
            className="truncate text-sm font-medium text-text-primary hover:text-[var(--color-brand-blue-text)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-brand-blue)] rounded-[var(--radius-sm)]"
          >
            {patientFullName(patient)}
          </Link>
        ) : (
          <span className="text-sm font-medium text-text-primary">Unknown patient</span>
        )}
        <p className="truncate text-xs text-text-secondary">{appointment.procedureType}</p>
      </div>
      <Badge tone={STATUS_TONE[appointment.status]}>{STATUS_LABEL[appointment.status]}</Badge>
    </li>
  );
}
