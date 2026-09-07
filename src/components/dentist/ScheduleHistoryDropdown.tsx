"use client";

import { useId, useState } from "react";
import { ChevronDown, History } from "lucide-react";
import { patientFullName } from "@/lib/patient-format";
import type { AppointmentWithPatient } from "@/lib/data/appointments";
import { cn } from "@/lib/cn";

export function ScheduleHistoryDropdown({ recentVisits }: { recentVisits: AppointmentWithPatient[] }) {
  const [open, setOpen] = useState(false);
  const listId = useId();

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-controls={listId}
        className="flex items-center gap-2 rounded-[var(--radius-md)] border border-border bg-surface px-3 py-2 text-sm font-medium text-text-primary hover:bg-surface-muted focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-brand-blue)]"
      >
        <History className="h-4 w-4" aria-hidden="true" />
        History
        <ChevronDown
          className={cn("h-4 w-4 transition-transform", open && "rotate-180")}
          aria-hidden="true"
        />
      </button>

      {open && (
        <ul
          id={listId}
          className="absolute right-0 z-20 mt-2 w-72 rounded-[var(--radius-lg)] border border-border bg-surface p-2 shadow-popover"
        >
          {recentVisits.map((visit) => (
            <li key={visit.id} className="rounded-[var(--radius-md)] px-2 py-2 hover:bg-surface-muted">
              <p className="text-sm font-medium text-text-primary">
                {patientFullName(visit.patient)}
              </p>
              <p className="text-xs text-text-secondary">
                {visit.procedureType} ·{" "}
                {visit.startTime.toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                })}
              </p>
            </li>
          ))}
          {recentVisits.length === 0 && (
            <li className="px-2 py-2 text-sm text-text-secondary">No recent visits.</li>
          )}
        </ul>
      )}
    </div>
  );
}
