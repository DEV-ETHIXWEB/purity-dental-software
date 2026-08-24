import type { LucideIcon } from "lucide-react";
import { UserCheck, Clock, UserX, CalendarCheck } from "lucide-react";
import { Card, CardContent } from "@/components/ui/Card";
import { cn } from "@/lib/cn";
import type { SampleAppointment } from "@/lib/sample-data";

interface StatTileProps {
  label: string;
  value: number;
  icon: LucideIcon;
  tone: "success" | "warning" | "error" | "neutral";
}

const TONE_CLASSES: Record<StatTileProps["tone"], string> = {
  neutral: "bg-info-bg text-[var(--color-brand-blue-text)]",
  success: "bg-success-bg text-success-text",
  warning: "bg-warning-bg text-warning-text",
  error: "bg-error-bg text-error-text",
};

function StatTile({ label, value, icon: Icon, tone }: StatTileProps) {
  return (
    <Card>
      <CardContent className="flex items-center gap-4">
        <div className={cn("flex h-11 w-11 shrink-0 items-center justify-center rounded-[var(--radius-lg)]", TONE_CLASSES[tone])}>
          <Icon className="h-5 w-5" aria-hidden="true" />
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm text-text-secondary">{label}</p>
          <p className="truncate text-xl font-semibold text-text-primary">{value}</p>
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Front-desk quick stats, derived entirely from today's appointment statuses
 * rather than independent hardcoded numbers, so this row always reconciles
 * with the visit list rendered alongside it.
 */
export function FrontDeskStatsRow({ todaysAppointments }: { todaysAppointments: SampleAppointment[] }) {
  const checkedIn = todaysAppointments.filter(
    (a) => a.status === "CHECKED_IN" || a.status === "IN_PROGRESS",
  ).length;
  const waiting = todaysAppointments.filter(
    (a) => a.status === "SCHEDULED" || a.status === "CONFIRMED",
  ).length;
  const noShows = todaysAppointments.filter((a) => a.status === "NO_SHOW").length;
  const completed = todaysAppointments.filter((a) => a.status === "COMPLETED").length;

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <StatTile label="Checked In" value={checkedIn} icon={UserCheck} tone="success" />
      <StatTile label="Waiting / Upcoming" value={waiting} icon={Clock} tone="warning" />
      <StatTile label="No-Shows Today" value={noShows} icon={UserX} tone="error" />
      <StatTile label="Completed Today" value={completed} icon={CalendarCheck} tone="neutral" />
    </div>
  );
}
