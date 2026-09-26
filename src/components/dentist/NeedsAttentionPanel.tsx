"use client";

import { useId, useState } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, ChevronDown } from "lucide-react";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { useClinicTimeZone } from "@/components/shell/ClinicTimeZone";
import { resolveAppointment } from "@/lib/actions/resolve-appointment";
import { formatClinicDate, formatClinicTime } from "@/lib/datetime";
import { patientFullName } from "@/lib/patient-format";
import { cn } from "@/lib/cn";
import type { AppointmentOutcome } from "@/lib/appointment-status";
import type { AppointmentWithPatient } from "@/lib/data/appointments";

export interface NeedsAttentionPanelProps {
  /** Past visits still sitting in an open status — see `lib/appointment-status.ts`. */
  appointments: AppointmentWithPatient[];
}

/**
 * The queue of past visits nobody ever closed out.
 *
 * Before this existed, a booking simply stayed "Scheduled" forever once its
 * time passed: the practice had patients still marked "Checked In" a month
 * later, and every completed/on-time statistic counted one visit out of
 * fifteen. Marking them up is a judgement only a human can make, so this puts
 * the decision in front of staff instead of guessing on a timer.
 */
export function NeedsAttentionPanel({ appointments }: NeedsAttentionPanelProps) {
  const router = useRouter();
  const timeZone = useClinicTimeZone();
  const [busyId, setBusyId] = useState<string | null>(null);
  // Starts closed. It sits above the board and grows with the backlog — at
  // thirteen unresolved visits it pushed the schedule itself off the first
  // screen — so the count in the bar is the default view and the list is
  // there when someone goes looking for it.
  const [collapsed, setCollapsed] = useState(true);
  const listId = useId();
  const [notice, setNotice] = useState<{ text: string; tone: "success" | "error" } | null>(null);

  async function resolve(appointment: AppointmentWithPatient, outcome: AppointmentOutcome) {
    if (busyId) return;
    setBusyId(appointment.id);
    const result = await resolveAppointment({ appointmentId: appointment.id, outcome });
    setBusyId(null);

    if (result.ok) {
      const name = appointment.patient ? patientFullName(appointment.patient) : "Visit";
      setNotice({
        text: `${name} marked ${outcome === "COMPLETED" ? "completed" : "as a no-show"}.`,
        tone: "success",
      });
      router.refresh();
    } else {
      setNotice({ text: result.error ?? "Couldn't update this visit.", tone: "error" });
    }
  }

  if (appointments.length === 0) return null;

  return (
    <div className="rounded-[var(--radius-lg)] border border-[var(--color-warning)]/40 bg-warning-bg/40 p-4">
      <button
        type="button"
        onClick={() => setCollapsed((v) => !v)}
        aria-expanded={!collapsed}
        aria-controls={listId}
        className={cn(
          "flex w-full items-start gap-2 rounded-[var(--radius-md)] text-left",
          // Full-width but only ~22px tall on a phone, which is under the
          // touch minimum; the floor pads the row without moving the label.
          "min-h-11 sm:min-h-0",
          "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-brand-blue)]",
          !collapsed && "mb-3",
        )}
      >
        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-warning-text" aria-hidden="true" />
        <div className="min-w-0 flex-1">
          <h3 className="text-sm font-semibold text-text-primary">
            Needs attention · {appointments.length}
          </h3>
          {/* The explanation is the part worth hiding; the count above is
              what makes the collapsed bar still worth reading. */}
          {!collapsed && (
            <p className="text-xs text-text-secondary">
              These visits have passed but were never closed out. Marking them keeps your visit
              counts and history accurate.
            </p>
          )}
        </div>
        <span className="flex items-center gap-1 text-xs font-medium text-text-secondary">
          {collapsed ? "Show" : "Hide"}
          <ChevronDown
            className={cn(
              "h-4 w-4 transition-transform duration-200 ease-out motion-reduce:transition-none",
              !collapsed && "rotate-180",
            )}
            aria-hidden="true"
          />
        </span>
      </button>

      <ul id={listId} hidden={collapsed} className="flex flex-col gap-2">
        {appointments.map((appt) => (
          <li
            key={appt.id}
            className="flex flex-wrap items-center justify-between gap-3 rounded-[var(--radius-md)] border border-border bg-surface px-3 py-2"
          >
            <div className="flex min-w-0 items-center gap-3">
              {appt.patient && (
                <Avatar name={patientFullName(appt.patient)} src={appt.patient.photoUrl} size="sm" />
              )}
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-text-primary">
                  {appt.patient ? patientFullName(appt.patient) : "Unknown patient"}
                </p>
                <p className="truncate text-xs text-text-secondary">
                  {appt.procedureType} · {formatClinicDate(appt.startTime, timeZone)} at{" "}
                  {formatClinicTime(appt.startTime, timeZone)}
                </p>
              </div>
            </div>

            <div className="flex shrink-0 gap-2">
              <Button
                size="sm"
                variant="outline"
                disabled={busyId === appt.id}
                onClick={() => resolve(appt, "NO_SHOW")}
              >
                No show
              </Button>
              <Button size="sm" disabled={busyId === appt.id} onClick={() => resolve(appt, "COMPLETED")}>
                {busyId === appt.id ? "Saving…" : "Completed"}
              </Button>
            </div>
          </li>
        ))}
      </ul>

      <p
        aria-live="polite"
        className={cn(
          "text-sm",
          notice && !collapsed && "mt-3",
          !notice && "sr-only",
          notice?.tone === "error" ? "text-error" : "text-success-text",
        )}
      >
        {notice?.text}
      </p>
    </div>
  );
}
