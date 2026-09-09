import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { ClockSlotIconFilled } from "@/components/ui/icons/purity-icons";
import { AppointmentListItem } from "@/components/dentist/AppointmentListItem";
import type { AppointmentWithPatient } from "@/lib/data/appointments";

export interface TodaysScheduleCardProps {
  appointments: AppointmentWithPatient[];
  completed: number;
  /** Portal route prefix (e.g. "/hygienist"). */
  basePath?: string;
  /** Route to the full schedule page. */
  scheduleHref: string;
}

/**
 * The dashboard's primary workspace — today's real appointments, not a
 * decorative summary of them. Replaces a standalone completion ring +
 * illustration with the actual list a provider needs to act on, with
 * completion folded into the header as plain text rather than its own
 * large visual.
 */
export function TodaysScheduleCard({ appointments, completed, basePath = "", scheduleHref }: TodaysScheduleCardProps) {
  const total = appointments.length;

  return (
    <Card className="animate-rise-in stagger-1 flex h-full flex-col transition-shadow duration-300 ease-out hover:shadow-card-hover">
      <CardHeader className="items-start">
        <div>
          <CardTitle>Today&apos;s Schedule</CardTitle>
          <p className="mt-0.5 text-sm text-text-secondary">
            {total === 0 ? "No visits booked today." : `${completed} of ${total} completed`}
          </p>
        </div>
        <Link
          href={scheduleHref}
          className="group/open inline-flex items-center gap-1.5 rounded-[var(--radius-sm)] text-sm font-medium text-[var(--color-brand-blue-text)] hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-brand-blue)]"
        >
          Open schedule
          <ArrowRight
            className="h-3.5 w-3.5 transition-transform duration-200 ease-out group-hover/open:translate-x-1 motion-reduce:group-hover/open:translate-x-0"
            aria-hidden="true"
          />
        </Link>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col">
        {total === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-2 rounded-[var(--radius-lg)] border border-dashed border-border px-4 py-10 text-center">
            <ClockSlotIconFilled className="h-5 w-5" aria-hidden="true" />
            <p className="text-sm font-medium text-text-primary">Nothing on the books today</p>
            <p className="text-xs text-text-secondary">Open the schedule to fill the day from the waitlist.</p>
          </div>
        ) : (
          <ul className="divide-y divide-border">
            {appointments.map((appt) => (
              <AppointmentListItem key={appt.id} appointment={appt} basePath={basePath} />
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
