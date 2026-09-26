"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/Card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/Tabs";
import { ScheduleDayView } from "@/components/dentist/ScheduleDayView";
import { ScheduleCalendarView } from "@/components/dentist/ScheduleCalendarView";
import { ScheduleWaitlistSidebar } from "@/components/dentist/ScheduleWaitlistSidebar";
import { NewAppointmentModal } from "@/components/dentist/NewAppointmentModal";
import { NeedsAttentionPanel } from "@/components/dentist/NeedsAttentionPanel";
import { Button } from "@/components/ui/Button";
import { clinicDayKey, clinicHour, clinicParts, instantFromClinicWallClock } from "@/lib/datetime";
import { moveAppointment } from "@/lib/actions/move-appointment";
import type { Patient, User } from "@/generated/prisma/client";
import { bookFromWaitlist } from "@/lib/actions/book-from-waitlist";
import type { AppointmentWithPatient } from "@/lib/data/appointments";
import type { WaitlistEntryWithPatient } from "@/lib/data/waitlist";
import { cn } from "@/lib/cn";
import { useClinicTimeZone } from "@/components/shell/ClinicTimeZone";

export interface ScheduleBoardProps {
  date: Date;
  /** Today's appointments only — the Day tab's agenda. */
  appointments: AppointmentWithPatient[];
  /** Everything from now forward, for the Upcoming calendar. */
  upcomingAppointments: AppointmentWithPatient[];
  /** Everything before now, for the Past calendar. */
  pastAppointments: AppointmentWithPatient[];
  waitlist: WaitlistEntryWithPatient[];
  /** Provider these dropped-in bookings are attributed to. */
  providerId: string;
  /** Portal route prefix for patient profile links (e.g. "/hygienist"). */
  basePath?: string;
  /** Patients bookable from this portal. */
  patients: Patient[];
  /** Clinicians bookable from this portal — just the signed-in one here. */
  providers: User[];
  /** Past visits still in an open status, for the "Needs attention" queue. */
  unresolvedPast: AppointmentWithPatient[];
  /** Opens the booking dialog straight away (the top bar's "New Appointment" lands here with `?book=1`). */
  openBookingOnMount?: boolean;
}

export function ScheduleBoard({
  date,
  appointments,
  upcomingAppointments,
  pastAppointments,
  waitlist,
  providerId,
  basePath = "",
  patients,
  providers,
  unresolvedPast,
  openBookingOnMount = false,
}: ScheduleBoardProps) {
  const router = useRouter();
  const timeZone = useClinicTimeZone();
  const [bookingOpen, setBookingOpen] = useState(openBookingOnMount);
  const [dropNotice, setDropNotice] = useState<{ text: string; tone: "success" | "error" } | null>(null);
  const [bookingId, setBookingId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  /** The instant at which this board's day reads `hour:00` on the practice's clock. */
  function instantForHour(hour: number) {
    const { year, month, day } = clinicParts(date, timeZone);
    return instantFromClinicWallClock(year, month, day, hour, 0, timeZone);
  }

  /** First hour of the working day with nothing in it — the "next opening". */
  function nextOpenHour() {
    const taken = new Set(appointments.map((a) => clinicHour(a.startTime, timeZone)));
    for (let hour = 9; hour <= 18; hour++) {
      if (!taken.has(hour)) return hour;
    }
    return 9;
  }

  /**
   * Books a waitlist entry into a specific hour on this day.
   *
   * The hour is the caller's: dropping someone on 2pm books 2pm. The old
   * behaviour computed a slot of its own and ignored where you let go, which
   * made the drag look broken even when the booking succeeded.
   */
  async function bookWaitlistIntoHour(waitlistEntryId: string, hour: number) {
    if (busy) return;
    const entry = waitlist.find((w) => w.id === waitlistEntryId);
    if (!entry) return;

    const startTime = instantForHour(hour);
    setBusy(true);
    setBookingId(entry.id);
    const result = await bookFromWaitlist({
      waitlistEntryId: entry.id,
      providerId,
      startTime: startTime.toISOString(),
      endTime: new Date(startTime.getTime() + 45 * 60000).toISOString(),
    });
    setBookingId(null);
    setBusy(false);

    if (result.ok) {
      setDropNotice({
        text: `${entry.patient.firstName} ${entry.patient.lastName} booked in.`,
        tone: "success",
      });
      router.refresh();
    } else {
      setDropNotice({ text: result.error ?? "Couldn't book this slot.", tone: "error" });
    }
  }

  /**
   * "Book next opening" — the keyboard, touch and screen-reader path to the
   * same booking. Native drag-and-drop reaches none of them.
   */
  async function bookEntry(entry: WaitlistEntryWithPatient) {
    await bookWaitlistIntoHour(entry.id, nextOpenHour());
  }

  /** Drops an appointment already on the board into a different hour. */
  async function moveAppointmentToHour(appointmentId: string, hour: number) {
    if (busy) return;
    setBusy(true);
    const result = await moveAppointment({
      appointmentId,
      startTime: instantForHour(hour).toISOString(),
    });
    setBusy(false);

    if (result.ok) {
      setDropNotice({ text: "Appointment moved.", tone: "success" });
      router.refresh();
    } else {
      setDropNotice({ text: result.error ?? "Couldn't move that appointment.", tone: "error" });
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <NeedsAttentionPanel appointments={unresolvedPast} />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
      <div className="lg:col-span-2">
        <Card>
          <CardContent>
            <Tabs defaultValue="day">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <TabsList>
                  <TabsTrigger value="day">Day</TabsTrigger>
                  <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
                  <TabsTrigger value="past">Past</TabsTrigger>
                </TabsList>
                <Button size="sm" onClick={() => setBookingOpen(true)}>
                  New appointment
                </Button>
              </div>

              <TabsContent value="day">
                <ScheduleDayView
                  date={date}
                  appointments={appointments}
                  timeZone={timeZone}
                  onDropWaitlist={bookWaitlistIntoHour}
                  onMoveAppointment={moveAppointmentToHour}
                  busy={busy}
                />
              </TabsContent>

              <TabsContent value="upcoming">
                <ScheduleCalendarView
                  appointments={upcomingAppointments}
                  mode="upcoming"
                  basePath={basePath}
                />
              </TabsContent>

              <TabsContent value="past">
                <ScheduleCalendarView appointments={pastAppointments} mode="past" basePath={basePath} />
              </TabsContent>
            </Tabs>

            {/*
             * Outside the tab panels on purpose: "Book next opening" lives in
             * the waitlist sidebar, which stays on screen whichever tab is
             * open, so its confirmation has to stay on screen too.
             */}
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
              Drag a patient onto any slot, or use &ldquo;Book next opening.&rdquo; Appointments already on the board can be dragged to a different time.
            </p>
          </CardContent>
        </Card>
        </div>
      </div>

      <NewAppointmentModal
        open={bookingOpen}
        onClose={() => setBookingOpen(false)}
        patients={patients}
        providers={providers}
        defaultProviderId={providerId}
        defaultDate={clinicDayKey(date, timeZone)}
      />
    </div>
  );
}
