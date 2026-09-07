"use client";

import { Loader2 } from "lucide-react";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { patientFullName } from "@/lib/patient-format";
import type { WaitlistEntryWithPatient } from "@/lib/data/waitlist";

export interface ScheduleWaitlistSidebarProps {
  entries: WaitlistEntryWithPatient[];
  /** Id of the entry currently being booked, if any — disables other actions while a booking is in flight. */
  bookingId?: string | null;
  /** Books this entry into the next open slot. Same action the drag-and-drop drop target performs. */
  onBook?: (entry: WaitlistEntryWithPatient) => void;
}

/**
 * "Open time / ASAP" waitlist. Entries are HTML5-draggable so they can be
 * dropped onto an open slot in the day view; this component is shared as-is
 * by the Hygienist schedule (whiteboard note: "Hygienist is the same
 * structure") via `ScheduleBoard`. Drag-and-drop is a progressive
 * enhancement on top of the "Book next opening" button below — native HTML5
 * drag-and-drop has no touch-device or keyboard equivalent, so the button is
 * the one interaction every user (mouse, touch, keyboard, screen reader) can
 * actually use to perform this same booking.
 */
export function ScheduleWaitlistSidebar({ entries, bookingId, onBook }: ScheduleWaitlistSidebarProps) {
  return (
    <div>
      <h2 className="mb-3 text-sm font-semibold text-text-primary">Open Time / ASAP</h2>
      {entries.length === 0 ? (
        <p className="text-sm text-text-secondary">No patients waiting for an opening.</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {entries.map((entry) => {
            const name = patientFullName(entry.patient);
            const isBooking = bookingId === entry.id;
            return (
              <li
                key={entry.id}
                draggable
                onDragStart={(e) => {
                  e.dataTransfer.setData("text/plain", entry.patientId);
                  e.dataTransfer.effectAllowed = "copy";
                }}
                className="cursor-grab rounded-[var(--radius-md)] border border-border bg-surface p-3 shadow-card active:cursor-grabbing"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <Avatar name={name} src={entry.patient.photoUrl} size="sm" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-text-primary">{name}</p>
                    <p className="truncate text-xs text-text-secondary">{entry.requestedProcedure}</p>
                  </div>
                </div>
                <div className="mt-2 flex items-center justify-between gap-2">
                  <Badge tone="warning">{entry.reason}</Badge>
                  {onBook && (
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={!!bookingId}
                      onClick={() => onBook(entry)}
                    >
                      {isBooking && (
                        <Loader2 className="h-4 w-4 animate-spin motion-reduce:animate-none" aria-hidden="true" />
                      )}
                      {isBooking ? "Booking…" : "Book next opening"}
                    </Button>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
