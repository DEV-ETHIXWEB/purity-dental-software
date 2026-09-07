"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { AppointmentListItem } from "@/components/dentist/AppointmentListItem";
import { cn } from "@/lib/cn";
import type { AppointmentWithPatient } from "@/lib/data/appointments";

const DAY_LETTERS = ["S", "M", "T", "W", "T", "F", "S"];

function startOfDay(d: Date): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function addDays(d: Date, n: number): Date {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
}

function isSameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

export interface UpcomingCardProps {
  /** All of the provider's appointments (already fetched for the dashboard) — filtered/windowed entirely client-side, no extra data fetch on week navigation. */
  appointments: AppointmentWithPatient[];
  basePath?: string;
}

/**
 * Third dashboard column: a single-week day strip (no month-grid — Figma's
 * reference shows just S–S with one highlighted day + prev/next) plus an
 * agenda list for whichever day is selected, matching the reference's
 * calendar + agenda pairing.
 */
export function UpcomingCard({ appointments, basePath }: UpcomingCardProps) {
  const [anchorDate, setAnchorDate] = useState(() => startOfDay(new Date()));
  const today = startOfDay(new Date());

  const weekStart = addDays(anchorDate, -anchorDate.getDay());
  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  const dayAppointments = appointments
    .filter((a) => a.status !== "CANCELLED" && isSameDay(a.startTime, anchorDate))
    .sort((a, b) => a.startTime.getTime() - b.startTime.getTime());

  const monthLabel = anchorDate.toLocaleDateString("en-US", { month: "long", year: "numeric" });

  return (
    <Card className="flex h-full flex-col">
      <CardHeader className="items-center">
        <CardTitle>Upcoming</CardTitle>
        <div className="flex items-center gap-1 text-sm">
          <button
            type="button"
            onClick={() => setAnchorDate((d) => addDays(d, -7))}
            aria-label="Previous week"
            className="rounded-[var(--radius-md)] p-1 text-text-secondary hover:bg-surface-muted focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-brand-blue)]"
          >
            <ChevronLeft className="h-4 w-4" aria-hidden="true" />
          </button>
          <span className="min-w-[9ch] text-center font-medium text-text-primary">{monthLabel}</span>
          <button
            type="button"
            onClick={() => setAnchorDate((d) => addDays(d, 7))}
            aria-label="Next week"
            className="rounded-[var(--radius-md)] p-1 text-text-secondary hover:bg-surface-muted focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-brand-blue)]"
          >
            <ChevronRight className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col gap-4">
        <div className="grid grid-cols-7 gap-1 text-center">
          {days.map((d, i) => {
            const isActive = isSameDay(d, anchorDate);
            const isToday = isSameDay(d, today);
            return (
              <button
                key={d.toISOString()}
                type="button"
                onClick={() => setAnchorDate(d)}
                aria-current={isActive ? "date" : undefined}
                className="flex flex-col items-center gap-1 rounded-[var(--radius-md)] py-1.5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-brand-blue)]"
              >
                <span className="text-[10px] font-medium text-text-secondary">{DAY_LETTERS[i]}</span>
                <span
                  className={cn(
                    "flex h-7 w-7 items-center justify-center rounded-full text-sm font-medium",
                    isActive
                      ? "bg-[var(--color-brand-blue)] text-white"
                      : isToday
                        ? "text-[var(--color-brand-blue-text)]"
                        : "text-text-primary hover:bg-surface-muted",
                  )}
                >
                  {d.getDate()}
                </span>
              </button>
            );
          })}
        </div>

        <div className="flex-1">
          {dayAppointments.length === 0 ? (
            <p className="py-6 text-center text-sm text-text-secondary">No visits this day.</p>
          ) : (
            <ul className="divide-y divide-border">
              {dayAppointments.map((appt) => (
                <AppointmentListItem key={appt.id} appointment={appt} basePath={basePath} />
              ))}
            </ul>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
