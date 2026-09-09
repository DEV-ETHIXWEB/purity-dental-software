/** Shared date/time formatting helpers for the Patient portal's friendlier copy. */

export function formatFriendlyDate(date: Date, timeZone?: string) {
  return date.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    timeZone,
  });
}

export function formatShortDate(date: Date) {
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function formatTime(date: Date, timeZone?: string) {
  return date.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    timeZone,
  });
}

/**
 * Time-of-day greeting, resolved in the practice's timezone rather than the
 * server's — these pages render on the server, so `new Date()` alone would
 * greet a patient by whatever region the app happens to be deployed in.
 */
export function greetingFor(now: Date, timeZone: string) {
  const hour = Number(
    new Intl.DateTimeFormat("en-US", { hour: "numeric", hour12: false, timeZone }).format(now),
  );
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

/** "Saturday, 16 August" — the dashboard's at-a-glance date line. */
export function formatHeroDate(date: Date, timeZone: string) {
  return date.toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    timeZone,
  });
}

/**
 * Whole calendar days between two instants, counted on the practice's
 * local day boundaries. A raw millisecond division would call an
 * appointment 14 hours away "0 days" even when it's tomorrow morning;
 * comparing `en-CA` (YYYY-MM-DD) date stamps counts the boundary crossings
 * a patient actually means by "in 2 days".
 */
export function daysBetween(from: Date, to: Date, timeZone: string) {
  const stamp = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  return Math.round((Date.parse(stamp.format(to)) - Date.parse(stamp.format(from))) / 86_400_000);
}

/** "Today" / "Tomorrow" / "9 days" — the hero countdown's headline. */
export function formatDayCountdown(days: number) {
  if (days <= 0) return "Today";
  if (days === 1) return "Tomorrow";
  return `${days} days`;
}

/** "Tue, 25 Aug · 10:30 AM" — the hero card's one-line appointment stamp. */
export function formatAppointmentStamp(date: Date, timeZone: string) {
  const day = date.toLocaleDateString("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
    timeZone,
  });
  const time = date.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    timeZone,
  });
  return `${day} · ${time}`;
}
