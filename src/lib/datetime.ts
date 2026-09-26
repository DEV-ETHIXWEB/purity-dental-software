/**
 * Clinic-timezone date/time formatting.
 *
 * `Appointment.startTime` and friends are stored as UTC instants; the schema
 * says they must be rendered in `Organization.timezone` (prisma/schema.prisma).
 * The Patient portal already did that via its own formatters; the staff portals
 * used bare `toLocaleTimeString()`, which renders in whatever zone the viewer's
 * browser happens to be in. A New York practice opened from another timezone
 * showed its own staff the wrong appointment times.
 *
 * Every helper here takes the practice timezone explicitly. Client Components
 * get it from `useClinicTimeZone()`; Server Components take it as a prop from
 * the page that resolved the organization.
 *
 * ── Instants vs. calendar dates ──────────────────────────────────────────────
 * Not every DateTime column is an instant. `Patient.dateOfBirth` is a calendar
 * date, seeded as "1990-04-12" and therefore stored at UTC midnight. Rendering
 * that in America/New_York moves it to 8pm on the 11th — the patient's birthday
 * changes. Use `formatCalendarDate()` for those columns, never the clinic-zone
 * helpers.
 */

/**
 * Used when an organization row is somehow missing a timezone. Matches the
 * `@default` on `Organization.timezone` in the schema — a practice with no
 * timezone set behaves as the schema says it does, rather than drifting to
 * whatever zone the server happens to run in.
 */
export const DEFAULT_CLINIC_TIMEZONE = "America/New_York";

const TIME = { hour: "numeric", minute: "2-digit" } as const;
const DATE_MEDIUM = { month: "short", day: "numeric", year: "numeric" } as const;
const DATE_SHORT = { month: "short", day: "numeric" } as const;
const DAY_LONG = { weekday: "long", month: "long", day: "numeric" } as const;
const MONTH_YEAR = { month: "long", year: "numeric" } as const;

/** "10:00 AM" in the practice's timezone. */
export function formatClinicTime(date: Date, timeZone: string): string {
  return date.toLocaleTimeString("en-US", { ...TIME, timeZone });
}

/** "Sep 10, 2026" in the practice's timezone. */
export function formatClinicDate(date: Date, timeZone: string): string {
  return date.toLocaleDateString("en-US", { ...DATE_MEDIUM, timeZone });
}

/** "Sep 10" — used where the year is obvious from context. */
export function formatClinicDateShort(date: Date, timeZone: string): string {
  return date.toLocaleDateString("en-US", { ...DATE_SHORT, timeZone });
}

/** "Monday, September 21" — schedule day headings. */
export function formatClinicDayLong(date: Date, timeZone: string): string {
  return date.toLocaleDateString("en-US", { ...DAY_LONG, timeZone });
}

/** "Sep 10, 1:45 PM" — message timestamps and signature stamps. */
export function formatClinicDateTime(date: Date, timeZone: string): string {
  return date.toLocaleString("en-US", { ...DATE_SHORT, ...TIME, timeZone });
}

/** "September 2026" — calendar headers. */
export function formatClinicMonthYear(date: Date, timeZone: string): string {
  return date.toLocaleDateString("en-US", { ...MONTH_YEAR, timeZone });
}

/**
 * A calendar-date column (stored at UTC midnight), rendered as the date that
 * was actually entered. Deliberately pinned to UTC — see the header note.
 */
export function formatCalendarDate(date: Date): string {
  return date.toLocaleDateString("en-US", { ...DATE_MEDIUM, timeZone: "UTC" });
}

/**
 * The same UTC-pinned calendar date, spelled out ("April 12, 1990").
 *
 * The Patient portal writes dates of birth in full while staff tables use
 * the short form, so this exists to keep that copy rather than force one
 * style on both — the point is that the pinning lives here either way. A
 * plain `toLocaleDateString` on a UTC-midnight column resolves in whatever
 * zone the server runs in, which silently moves the date back a day for any
 * deployment west of UTC.
 */
export function formatCalendarDateLong(date: Date): string {
  return date.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  });
}

export interface ClinicParts {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
}

/**
 * An instant broken into the practice's wall-clock fields. Everything that
 * buckets appointments — which calendar square, which hour row — has to agree
 * on this, or a late-evening visit lands on the wrong day for half the staff.
 */
export function clinicParts(date: Date, timeZone: string): ClinicParts {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(date);

  const value = (type: Intl.DateTimeFormatPartTypes) =>
    Number(parts.find((p) => p.type === type)?.value ?? "0");

  return {
    year: value("year"),
    month: value("month"),
    day: value("day"),
    // `hour12: false` renders midnight as "24" in some ICU versions.
    hour: value("hour") % 24,
    minute: value("minute"),
  };
}

/** "2026-09-21" — calendar-square identity for an instant, in practice time. */
export function clinicDayKey(date: Date, timeZone: string): string {
  const { year, month, day } = clinicParts(date, timeZone);
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

/** Hour-of-day (0–23) for an instant, in practice time — the day view's row bucket. */
export function clinicHour(date: Date, timeZone: string): number {
  return clinicParts(date, timeZone).hour;
}

/** Today's calendar-square key in practice time. */
export function clinicTodayKey(timeZone: string, now: Date = new Date()): string {
  return clinicDayKey(now, timeZone);
}

/**
 * The instant at which the practice's wall clock reads the given date/time.
 *
 * The inverse of `clinicParts`. `new Date(2026, 8, 22, 19, 0)` would build
 * that moment in whatever zone the *server or browser* runs in, so a booking
 * made for "7pm" landed at the wrong instant. This measures the zone's offset
 * on that particular date — so DST is accounted for — and subtracts it.
 *
 * `month` is 1-based; out-of-range `day` values roll over as `Date.UTC` does,
 * which is what makes "the start of the next day" a one-liner.
 */
export function instantFromClinicWallClock(
  year: number,
  month: number,
  day: number,
  hour: number,
  minute: number,
  timeZone: string,
): Date {
  const guess = new Date(Date.UTC(year, month - 1, day, hour, minute));
  const rendered = clinicParts(guess, timeZone);
  const renderedUtc = Date.UTC(
    rendered.year,
    rendered.month - 1,
    rendered.day,
    rendered.hour,
    rendered.minute,
  );
  return new Date(guess.getTime() - (renderedUtc - guess.getTime()));
}

/** Midnight that begins the practice's current day. */
export function clinicStartOfDay(now: Date, timeZone: string): Date {
  const { year, month, day } = clinicParts(now, timeZone);
  return instantFromClinicWallClock(year, month, day, 0, 0, timeZone);
}

/**
 * Midnight that begins the practice's *next* day — the exclusive upper bound
 * for "today". Built by rolling the calendar date forward rather than adding
 * 24 hours, because a DST day is 23 or 25 hours long.
 */
export function clinicStartOfNextDay(now: Date, timeZone: string): Date {
  const { year, month, day } = clinicParts(now, timeZone);
  return instantFromClinicWallClock(year, month, day + 1, 0, 0, timeZone);
}

/** Monday 00:00 of the practice's current week (ISO week, not US Sunday-start). */
export function clinicStartOfWeek(now: Date, timeZone: string): Date {
  const { year, month, day } = clinicParts(now, timeZone);
  const weekday = new Date(Date.UTC(year, month - 1, day)).getUTCDay(); // 0 = Sunday
  const backToMonday = weekday === 0 ? -6 : 1 - weekday;
  return instantFromClinicWallClock(year, month, day + backToMonday, 0, 0, timeZone);
}
