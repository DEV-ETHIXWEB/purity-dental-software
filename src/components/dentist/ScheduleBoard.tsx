"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/Card";
import { ScheduleDayView } from "@/components/dentist/ScheduleDayView";
import { ScheduleWaitlistSidebar } from "@/components/dentist/ScheduleWaitlistSidebar";
import { ScheduleHistoryDropdown } from "@/components/dentist/ScheduleHistoryDropdown";
import { bookFromWaitlist } from "@/lib/actions/book-from-waitlist";
import type { AppointmentWithPatient } from "@/lib/data/appointments";
import type { WaitlistEntryWithPatient } from "@/lib/data/waitlist";
import { cn } from "@/lib/cn";

export interface ScheduleBoardProps {
  date: Date;
  appointments: AppointmentWithPatient[];
  waitlist: WaitlistEntryWithPatient[];
  recentVisits: AppointmentWithPatient[];
  /** Provider these dropped-in bookings are attributed to. */
  providerId: string;
}

export function ScheduleBoard({
  date,
  appointments,
  waitlist,
  recentVisits,
  providerId,
}: ScheduleBoardProps) {
  const router = useRouter();
  const [isDragOver, setIsDragOver] = useState(false);
  const [dropNotice, setDropNotice] = useState<{ text: string; tone: "success" | "error" } | null>(null);
  const [bookingId, setBookingId] = useState<string | null>(null);

  /**
   * Books a waitlist entry into the next open hour after 8am on this day —
   * shared by both the drag-and-drop drop target and the "Book next
   * opening" button, so keyboard/touch/screen-reader users (for whom native
   * HTML5 drag-and-drop is entirely unusable) have a real way to perform
   * this same action, not just a documented-but-nonexistent fallback.
   */
  async function bookEntry(entry: WaitlistEntryWithPatient) {
    if (bookingId) return;
    const nextSlot = new Date(date);
    nextSlot.setHours(9 + (appointments.length % 8), 0, 0, 0);
    const endSlot = new Date(nextSlot.getTime() + 45 * 60000);

    setBookingId(entry.id);
    const result = await bookFromWaitlist({
      waitlistEntryId: entry.id,
      providerId,
      startTime: nextSlot.toISOString(),
      endTime: endSlot.toISOString(),
    });
    setBookingId(null);

    if (result.ok) {
      setDropNotice({
        text: `${entry.patient.firstName} ${entry.patient.lastName} added to today's schedule.`,
        tone: "success",
      });
      router.refresh();
    } else {
      setDropNotice({ text: result.error ?? "Couldn't book this slot.", tone: "error" });
    }
  }

  async function handleDrop(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setIsDragOver(false);
    const patientId = e.dataTransfer.getData("text/plain");
    const entry = waitlist.find((w) => w.patientId === patientId);
    if (!entry) return;
    await bookEntry(entry);
  }

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
      <div className="lg:col-span-2">
        <Card>
          <CardContent>
            <div className="mb-4 flex items-center justify-end">
              <ScheduleHistoryDropdown recentVisits={recentVisits} />
            </div>
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragOver(true);
              }}
              onDragLeave={() => setIsDragOver(false)}
              onDrop={handleDrop}
              className={cn(
                "rounded-[var(--radius-lg)] transition-colors",
                isDragOver && "bg-info-bg/60 ring-2 ring-[var(--color-brand-blue)]",
              )}
            >
              <ScheduleDayView date={date} appointments={appointments} />
            </div>
            <p
              aria-live="polite"
              className={cn(
                "mt-3 text-sm",
                !dropNotice && "sr-only",
                dropNotice?.tone === "error" ? "text-error" : "text-success-text",
              )}
            >
              {dropNotice?.text}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="lg:col-span-1">
        <Card>
          <CardContent>
            <ScheduleWaitlistSidebar entries={waitlist} bookingId={bookingId} onBook={bookEntry} />
            <p className="mt-4 text-xs text-text-secondary">
              Drag a patient onto the schedule, or use &ldquo;Book next opening,&rdquo; to add them to today.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
