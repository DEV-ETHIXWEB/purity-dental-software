/**
 * Month-grid date math for the schedule calendars.
 *
 * Split out of `ScheduleCalendarView` so it can be unit tested in the
 * node-environment Vitest suite (see vitest.config.mts — there's no jsdom or
 * component-rendering setup here, by design). Month boundaries, week
 * trimming and DST transitions are exactly the parts that break quietly, so
 * they live where a test can reach them.
 *
 * Everything here works in LOCAL time. Appointment `startTime`s are UTC
 * instants that the UI renders in the viewer's zone, and a calendar square is
 * a local-time day — mixing the two lands a late-evening visit on the wrong
 * square.
 */

/** Local-time calendar-day identity, e.g. "2026-09-21". */
export function dayKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

/** Midnight on the first of `d`'s month, local time. */
export function startOfMonth(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

/** The first of the month `n` months from `d` (negative to go back). */
export function addMonths(d: Date, n: number): Date {
  return new Date(d.getFullYear(), d.getMonth() + n, 1);
}

/**
 * Sunday-aligned weeks covering `monthStart`'s month, trimmed to the weeks it
 * actually touches — a 28-day February beginning on a Sunday yields 4 rows,
 * not a padded 6.
 *
 * Days are built by incrementing a local `Date`, so a DST shift inside the
 * month moves the wall clock without skipping or repeating a calendar square.
 */
export function buildMonthGrid(monthStart: Date): Date[][] {
  const cursor = new Date(monthStart.getFullYear(), monthStart.getMonth(), 1);
  cursor.setDate(cursor.getDate() - cursor.getDay());

  const weeks: Date[][] = [];
  for (let w = 0; w < 6; w++) {
    const week: Date[] = [];
    for (let i = 0; i < 7; i++) {
      week.push(new Date(cursor));
      cursor.setDate(cursor.getDate() + 1);
    }
    weeks.push(week);
    // The next row would start in a later month — this month is fully drawn.
    if (cursor.getMonth() !== monthStart.getMonth() && cursor > monthStart) break;
  }
  return weeks;
}
