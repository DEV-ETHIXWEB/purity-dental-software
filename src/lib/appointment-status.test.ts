import { describe, expect, it } from "vitest";
import { displayStatusLabel, isUnresolvedPastVisit } from "@/lib/appointment-status";
import type { AppointmentStatus } from "@/generated/prisma/client";

const NOW = new Date("2026-09-22T12:00:00Z");
const HOUR = 3_600_000;

function visit(status: AppointmentStatus, endsInHours: number) {
  return { status, endTime: new Date(NOW.getTime() + endsInHours * HOUR) };
}

const LABELS: Record<AppointmentStatus, string> = {
  SCHEDULED: "Scheduled",
  CONFIRMED: "Confirmed",
  CHECKED_IN: "Checked In",
  IN_PROGRESS: "In Progress",
  COMPLETED: "Completed",
  CANCELLED: "Cancelled",
  NO_SHOW: "No Show",
};

describe("isUnresolvedPastVisit", () => {
  it("flags a booking whose time passed while still open", () => {
    // The real case: 8 visits sat in SCHEDULED weeks after their slot, and two
    // patients were still CHECKED_IN a month later.
    for (const status of ["SCHEDULED", "CONFIRMED", "CHECKED_IN", "IN_PROGRESS"] as const) {
      expect(isUnresolvedPastVisit(visit(status, -24), NOW)).toBe(true);
    }
  });

  it("leaves closed-out visits alone", () => {
    for (const status of ["COMPLETED", "CANCELLED", "NO_SHOW"] as const) {
      expect(isUnresolvedPastVisit(visit(status, -24), NOW)).toBe(false);
    }
  });

  it("does not flag future bookings", () => {
    expect(isUnresolvedPastVisit(visit("SCHEDULED", 24), NOW)).toBe(false);
    expect(isUnresolvedPastVisit(visit("CONFIRMED", 1), NOW)).toBe(false);
  });

  it("reads endTime, so a visit that is merely running late is not missed", () => {
    // Started an hour ago, still has half an hour to run.
    expect(isUnresolvedPastVisit(visit("IN_PROGRESS", 0.5), NOW)).toBe(false);
  });

  it("treats the exact end instant as not yet past", () => {
    expect(isUnresolvedPastVisit(visit("SCHEDULED", 0), NOW)).toBe(false);
  });
});

describe("displayStatusLabel", () => {
  it("relabels an unresolved past visit as Missed", () => {
    expect(displayStatusLabel(visit("SCHEDULED", -24), LABELS, NOW)).toBe("Missed");
    expect(displayStatusLabel(visit("CHECKED_IN", -24), LABELS, NOW)).toBe("Missed");
  });

  it("passes every other case through unchanged", () => {
    expect(displayStatusLabel(visit("SCHEDULED", 24), LABELS, NOW)).toBe("Scheduled");
    expect(displayStatusLabel(visit("COMPLETED", -24), LABELS, NOW)).toBe("Completed");
    expect(displayStatusLabel(visit("CANCELLED", -24), LABELS, NOW)).toBe("Cancelled");
  });
});
