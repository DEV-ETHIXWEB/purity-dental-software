import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Avatar } from "@/components/ui/Avatar";
import { CalendarIconFilled } from "@/components/ui/icons/purity-icons";
import { EmptyState } from "./EmptyState";
import { formatFriendlyDate, formatTime } from "./formatters";
import type { User, Appointment } from "@/generated/prisma/client";

export interface NextAppointmentPanelProps {
  appointment: (Appointment & { provider: Pick<User, "name" | "avatarUrl"> }) | null;
  /** Practice name — shown under the provider so the patient knows where to turn up. */
  practiceName: string;
  /**
   * IANA zone the visit time renders in. Appointments are stored as UTC
   * instants and belong to the practice, not the device — without this the
   * panel showed a different clock time than the hero card beside it for
   * one and the same appointment.
   */
  timeZone: string;
}

/**
 * The single appointment a patient most needs on opening the portal, given
 * its own panel beside the hero. `AppointmentCard` still handles the list
 * views; this is the one-up treatment, so it leads with the date rather
 * than the procedure and carries the primary "view" action.
 *
 * Only CONFIRMED visits get the confirmation badge — anything else would
 * imply a practice-side confirmation that hasn't happened yet.
 */
export function NextAppointmentPanel({ appointment, practiceName, timeZone }: NextAppointmentPanelProps) {
  return (
    <Card className="animate-rise-in stagger-2 transition-shadow duration-300 ease-out hover:shadow-card-hover">
      <CardHeader>
        <CardTitle>Your next appointment</CardTitle>
      </CardHeader>

      {appointment ? (
        <CardContent className="flex flex-col gap-4">
          <div className="flex items-start gap-3">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[var(--radius-lg)] bg-surface-muted">
              <CalendarIconFilled className="h-6 w-6" aria-hidden="true" />
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                <p className="text-base font-semibold text-text-primary">
                  {appointment.procedureType}
                </p>
                {appointment.status === "CONFIRMED" && <Badge tone="success">Confirmed</Badge>}
              </div>
              <p className="mt-0.5 text-sm font-medium text-[var(--color-brand-blue-text)]">
                {formatFriendlyDate(appointment.startTime, timeZone)} • {formatTime(appointment.startTime, timeZone)}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 rounded-[var(--radius-lg)] border border-border p-3 transition-colors duration-200 ease-out hover:bg-surface-muted">
            <Avatar name={appointment.provider.name} src={appointment.provider.avatarUrl} size="md" />
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-text-primary">
                {appointment.provider.name}
              </p>
              <p className="truncate text-xs text-text-secondary">{practiceName}</p>
            </div>
          </div>

          <Link
            href="/patient/appointments"
            className="cta-gradient-slide inline-flex min-h-11 items-center justify-center rounded-[var(--radius-lg)] px-4 text-sm font-medium text-white shadow-card transition-transform duration-200 ease-out active:scale-[0.97] motion-reduce:active:scale-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-brand-blue)]"
          >
            View appointment
          </Link>
        </CardContent>
      ) : (
        <CardContent>
          <EmptyState
            icon={CalendarIconFilled}
            title="No upcoming visits scheduled"
            description="When you're ready, booking a visit only takes a minute."
            action={
              <Link
                href="/patient/appointments"
                className="cta-gradient-slide inline-flex min-h-11 items-center justify-center rounded-[var(--radius-lg)] px-4 text-sm font-medium text-white shadow-card transition-transform duration-200 ease-out active:scale-[0.97] motion-reduce:active:scale-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-brand-blue)]"
              >
                Book an appointment
              </Link>
            }
          />
        </CardContent>
      )}
    </Card>
  );
}
