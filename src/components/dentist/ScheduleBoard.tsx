"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/Card";
import { ScheduleDayView } from "@/components/dentist/ScheduleDayView";
import { ScheduleWaitlistSidebar, type WaitlistEntry } from "@/components/dentist/ScheduleWaitlistSidebar";
import { ScheduleHistoryDropdown } from "@/components/dentist/ScheduleHistoryDropdown";
import { currentProvider, getPatientById, patientFullName, type SampleAppointment } from "@/lib/sample-data";
import { cn } from "@/lib/cn";

export interface ScheduleBoardProps {
  date: Date;
  appointments: SampleAppointment[];
  waitlist: WaitlistEntry[];
  recentVisits: SampleAppointment[];
  /** Provider these dropped-in bookings are attributed to. Defaults to the Dentist portal's current provider. */
  providerId?: string;
  providerName?: string;
}

export function ScheduleBoard({
  date,
  appointments,
  waitlist,
  recentVisits,
  providerId = currentProvider.id,
  providerName = currentProvider.name,
}: ScheduleBoardProps) {
  const [dayAppointments, setDayAppointments] = useState(appointments);
  const [isDragOver, setIsDragOver] = useState(false);
  const [dropNotice, setDropNotice] = useState<string | null>(null);

  function handleDrop(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setIsDragOver(false);
    const patientId = e.dataTransfer.getData("text/plain");
    const patient = getPatientById(patientId);
    if (!patient) return;

    // Slot the patient into the next open hour after 8am, purely client-side
    // for this UI demo — no persistence layer exists yet.
    const nextSlot = new Date(date);
    nextSlot.setHours(9 + (dayAppointments.length % 8), 0, 0, 0);
    const newAppointment: SampleAppointment = {
      id: `appt_dropped_${Date.now()}`,
      patientId: patient.id,
      providerId,
      providerName,
      procedureType: "Open Slot Booking",
      status: "SCHEDULED",
      startTime: nextSlot.toISOString(),
      endTime: new Date(nextSlot.getTime() + 45 * 60000).toISOString(),
    };

    setDayAppointments((prev) => [...prev, newAppointment]);
    setDropNotice(`${patientFullName(patient)} added to today's schedule.`);
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
              <ScheduleDayView date={date} appointments={dayAppointments} />
            </div>
            <p aria-live="polite" className="sr-only">
              {dropNotice}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="lg:col-span-1">
        <Card>
          <CardContent>
            <ScheduleWaitlistSidebar entries={waitlist} />
            <p className="mt-4 text-xs text-text-secondary">
              Drag a patient onto the schedule to book the next open slot.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
