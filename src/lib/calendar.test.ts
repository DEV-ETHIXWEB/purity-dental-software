import { describe, expect, it } from "vitest";
import { addMonths, buildMonthGrid, dayKey, startOfMonth } from "@/lib/calendar";

describe("dayKey", () => {
  it("formats a local date as YYYY-MM-DD with zero padding", () => {
    expect(dayKey(new Date(2026, 0, 5))).toBe("2026-01-05");
    expect(dayKey(new Date(2026, 11, 31))).toBe("2026-12-31");
  });

  it("keeps a late-evening time on its own local day", () => {
    // The bug this guards: `toISOString().slice(0, 10)` would roll an
    // 11:30pm appointment forward to the next day in any zone behind UTC.
    expect(dayKey(new Date(2026, 8, 21, 23, 30))).toBe("2026-09-21");
    expect(dayKey(new Date(2026, 8, 21, 0, 15))).toBe("2026-09-21");
  });
});

describe("startOfMonth / addMonths", () => {
  it("snaps to the first of the month at midnight", () => {
    const start = startOfMonth(new Date(2026, 8, 21, 14, 30));
    expect(dayKey(start)).toBe("2026-09-01");
    expect(start.getHours()).toBe(0);
  });

  it("rolls across a year boundary in both directions", () => {
    expect(dayKey(addMonths(new Date(2026, 11, 1), 1))).toBe("2027-01-01");
    expect(dayKey(addMonths(new Date(2026, 0, 1), -1))).toBe("2025-12-01");
  });

  it("does not overflow when stepping from a 31-day month", () => {
    // `setMonth` on a Date sitting on the 31st would spill into March.
    expect(dayKey(addMonths(new Date(2026, 0, 31), 1))).toBe("2026-02-01");
  });
});

describe("buildMonthGrid", () => {
  it("starts every row on a Sunday and runs seven days", () => {
    for (const week of buildMonthGrid(new Date(2026, 8, 1))) {
      expect(week).toHaveLength(7);
      expect(week[0].getDay()).toBe(0);
      expect(week[6].getDay()).toBe(6);
    }
  });

  it("covers every day of the month exactly once", () => {
    const month = new Date(2026, 8, 1); // September 2026, 30 days
    const keys = buildMonthGrid(month)
      .flat()
      .filter((d) => d.getMonth() === 8)
      .map(dayKey);

    expect(new Set(keys).size).toBe(keys.length);
    expect(keys).toHaveLength(30);
    expect(keys[0]).toBe("2026-09-01");
    expect(keys.at(-1)).toBe("2026-09-30");
  });

  it("pads with neighbouring days so the first row is full", () => {
    // 1 September 2026 is a Tuesday, so Sunday 30 August leads the grid.
    const first = buildMonthGrid(new Date(2026, 8, 1))[0];
    expect(dayKey(first[0])).toBe("2026-08-30");
    expect(dayKey(first[2])).toBe("2026-09-01");
  });

  it("trims to four rows for a February that starts on a Sunday", () => {
    // 1 February 2026 is a Sunday and the month has 28 days — an exact fit.
    const weeks = buildMonthGrid(new Date(2026, 1, 1));
    expect(weeks).toHaveLength(4);
    expect(dayKey(weeks[0][0])).toBe("2026-02-01");
    expect(dayKey(weeks[3][6])).toBe("2026-02-28");
  });

  it("uses six rows for a 31-day month starting on a Saturday", () => {
    // 1 August 2026 is a Saturday: one trailing day, then 30 more.
    const weeks = buildMonthGrid(new Date(2026, 7, 1));
    expect(weeks).toHaveLength(6);
    expect(dayKey(weeks[0][6])).toBe("2026-08-01");
  });

  it("never repeats or skips a square across a DST transition", () => {
    // US DST ends 1 November 2026; March 2026 springs forward on the 8th.
    for (const month of [new Date(2026, 2, 1), new Date(2026, 10, 1)]) {
      const days = buildMonthGrid(month).flat();
      const keys = days.map(dayKey);
      expect(new Set(keys).size).toBe(keys.length);

      for (let i = 1; i < days.length; i++) {
        const gapHours = (days[i].getTime() - days[i - 1].getTime()) / 3_600_000;
        // 23h or 25h on the shift day, 24h otherwise — never 0 or 48.
        expect(gapHours).toBeGreaterThanOrEqual(23);
        expect(gapHours).toBeLessThanOrEqual(25);
      }
    }
  });

  it("closes out a December grid into the new year", () => {
    const weeks = buildMonthGrid(new Date(2026, 11, 1));
    const decDays = weeks.flat().filter((d) => d.getMonth() === 11);
    expect(decDays).toHaveLength(31);
    expect(weeks.flat().at(-1)!.getFullYear()).toBe(2027);
  });
});
