import { UserCheck, Clock, UserX, CalendarCheck } from "lucide-react";
import { StatStrip } from "@/components/ui/StatStrip";
import type { Appointment } from "@/generated/prisma/client";

/**
 * Front-desk quick stats, derived entirely from today's appointment statuses
 * rather than independent hardcoded numbers, so this row always reconciles
 * with the visit list rendered alongside it.
 */
export function FrontDeskStatsRow({ todaysAppointments }: { todaysAppointments: Appointment[] }) {
  const checkedIn = todaysAppointments.filter(
    (a) => a.status === "CHECKED_IN" || a.status === "IN_PROGRESS",
  ).length;
  const waiting = todaysAppointments.filter(
    (a) => a.status === "SCHEDULED" || a.status === "CONFIRMED",
  ).length;
  const noShows = todaysAppointments.filter((a) => a.status === "NO_SHOW").length;
  const completed = todaysAppointments.filter((a) => a.status === "COMPLETED").length;

  return (
    <StatStrip
      items={[
        { label: "Checked in", value: checkedIn, icon: UserCheck, tone: "success" },
        { label: "Waiting / upcoming", value: waiting, icon: Clock, tone: waiting > 0 ? "warning" : "default" },
        { label: "No-shows today", value: noShows, icon: UserX, tone: noShows > 0 ? "error" : "default" },
        { label: "Completed today", value: completed, icon: CalendarCheck },
      ]}
    />
  );
}
