import { describe, expect, it } from "vitest";
import {
  clinicDayKey,
  clinicHour,
  clinicParts,
  formatCalendarDate,
  formatClinicDate,
  formatClinicTime,
} from "@/lib/datetime";

const NY = "America/New_York";
const IST = "Asia/Kolkata";

describe("clinicParts", () => {
  it("resolves an instant into the practice's wall clock, not the server's", () => {
    // 01:30 UTC on the 22nd is still 21:30 on the 21st in New York.
    const instant = new Date("2026-09-22T01:30:00Z");
    expect(clinicParts(instant, NY)).toMatchObject({ year: 2026, month: 9, day: 21, hour: 21, minute: 30 });
    expect(clinicParts(instant, IST)).toMatchObject({ year: 2026, month: 9, day: 22, hour: 7, minute: 0 });
  });

  it("reports midnight as hour 0, not 24", () => {
    // `hour12: false` renders midnight as "24" in some ICU builds.
    expect(clinicParts(new Date("2026-09-22T04:00:00Z"), NY).hour).toBe(0);
  });

  it("follows the zone across a DST transition", () => {
    // US clocks spring forward at 2am local on 8 March 2026.
    expect(clinicParts(new Date("2026-03-08T06:59:00Z"), NY).hour).toBe(1); // EST
    expect(clinicParts(new Date("2026-03-08T07:00:00Z"), NY).hour).toBe(3); // EDT — 2am never happens
  });
});

describe("clinicDayKey", () => {
  it("puts a late-evening visit on the practice's calendar day", () => {
    const instant = new Date("2026-09-22T01:30:00Z");
    expect(clinicDayKey(instant, NY)).toBe("2026-09-21");
    expect(clinicDayKey(instant, IST)).toBe("2026-09-22");
  });

  it("zero-pads so keys sort and compare as strings", () => {
    expect(clinicDayKey(new Date("2026-01-05T17:00:00Z"), NY)).toBe("2026-01-05");
  });
});

describe("clinicHour", () => {
  it("buckets an out-of-hours visit into the hour the practice would call it", () => {
    // The bug this guards: a 8:45pm visit bucketed by the viewer's clock
    // landed outside the day view's 8-18 window and vanished from the agenda.
    expect(clinicHour(new Date("2026-09-22T00:45:00Z"), NY)).toBe(20);
  });
});

describe("formatCalendarDate", () => {
  it("keeps a date-only column on the date that was entered", () => {
    // dateOfBirth is seeded as "1990-04-12" and stored at UTC midnight.
    // Rendering it in New York would move the birthday to the 11th.
    const dob = new Date("1990-04-12T00:00:00Z");
    expect(formatCalendarDate(dob)).toBe("Apr 12, 1990");
    expect(formatClinicDate(dob, NY)).toBe("Apr 11, 1990");
  });
});

describe("formatClinicTime", () => {
  it("renders the practice's clock regardless of where it runs", () => {
    const instant = new Date("2026-09-22T14:00:00Z");
    expect(formatClinicTime(instant, NY)).toBe("10:00 AM");
    expect(formatClinicTime(instant, IST)).toBe("7:30 PM");
  });
});
