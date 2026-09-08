import Link from "next/link";
import { cn } from "@/lib/cn";
import { Avatar } from "@/components/ui/Avatar";
import { Badge, type BadgeTone } from "@/components/ui/Badge";
import { patientFullName } from "@/lib/patient-format";
import type { AppointmentWithPatient } from "@/lib/data/appointments";
import type { AppointmentStatus } from "@/generated/prisma/client";

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
  appointment: AppointmentWithPatient;
  /** Portal route prefix for the patient profile link (e.g. "/hygienist"). Defaults to the Dentist portal's root. */
  basePath?: string;
}

export function AppointmentListItem({ appointment, basePath = "" }: AppointmentListItemProps) {
  const patient = appointment.patient;
  const time = appointment.startTime.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });

  return (
    <li
      className={cn(
        "group/appt -mx-2 flex items-center gap-3 rounded-[var(--radius-md)] px-2 py-2.5",
        "transition-colors duration-200 ease-out hover:bg-surface-muted",
      )}
    >
      <div className="w-16 shrink-0 text-sm font-medium text-text-secondary transition-colors duration-200 ease-out group-hover/appt:text-text-primary">
        {time}
      </div>
      {patient && (
        <Avatar
          name={patientFullName(patient)}
          src={patient.photoUrl ?? undefined}
          size="sm"
          className="transition-transform duration-200 ease-out group-hover/appt:-translate-y-0.5 motion-reduce:group-hover/appt:translate-y-0"
        />
      )}
      <div className="min-w-0 flex-1">
        {patient ? (
          <Link
            href={`${basePath}/patients/${patient.id}`}
            className="truncate text-sm font-medium text-text-primary transition-all duration-200 ease-out group-hover/appt:-translate-y-0.5 group-hover/appt:text-[var(--color-brand-blue-text)] motion-reduce:group-hover/appt:translate-y-0 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-brand-blue)] rounded-[var(--radius-sm)]"
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
