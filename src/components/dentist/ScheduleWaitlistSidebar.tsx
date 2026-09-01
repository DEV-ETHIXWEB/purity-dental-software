"use client";

import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { getPatientById, patientFullName } from "@/lib/sample-data";

export interface WaitlistEntry {
  patientId: string;
  reason: string;
  requestedProcedure: string;
}

/**
 * "Open time / ASAP" waitlist. Entries are HTML5-draggable so they can be
 * dropped onto an open slot in the day view; this component is shared as-is
 * by the Hygienist schedule (whiteboard note: "Hygienist is the same
 * structure") via `ScheduleBoard`. Drag-and-drop is a progressive
 * enhancement — nothing here requires it to be usable.
 */
export function ScheduleWaitlistSidebar({ entries }: { entries: WaitlistEntry[] }) {
  return (
    <div>
      <h2 className="mb-3 text-sm font-semibold text-text-primary">Open Time / ASAP</h2>
      <ul className="flex flex-col gap-2">
        {entries.map((entry) => {
          const patient = getPatientById(entry.patientId);
          if (!patient) return null;
          const name = patientFullName(patient);
          return (
            <li
              key={entry.patientId}
              draggable
              onDragStart={(e) => {
                e.dataTransfer.setData("text/plain", entry.patientId);
                e.dataTransfer.effectAllowed = "copy";
              }}
              className="cursor-grab rounded-[var(--radius-md)] border border-border bg-surface p-3 shadow-card active:cursor-grabbing"
            >
              <div className="flex items-center gap-3">
                <Avatar name={name} src={patient.photoUrl} size="sm" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-text-primary">{name}</p>
                  <p className="truncate text-xs text-text-secondary">{entry.requestedProcedure}</p>
                </div>
              </div>
              <div className="mt-2">
                <Badge tone="warning">{entry.reason}</Badge>
              </div>
            </li>
          );
        })}
        {entries.length === 0 && (
          <p className="text-sm text-text-secondary">No patients waiting for an opening.</p>
        )}
      </ul>
    </div>
  );
}
