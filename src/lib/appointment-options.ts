/**
 * Bookable visit types and their default chair time.
 *
 * Deliberately NOT in `lib/actions/book-appointment.ts`: a `"use server"`
 * module may only export async functions, so a plain constant there fails the
 * build ("The module has no exports at all"). Both the server action and the
 * booking dialog import these from here.
 */
export const PROCEDURE_OPTIONS = [
  { value: "Routine Cleaning", minutes: 45 },
  { value: "Consultation", minutes: 30 },
  { value: "Follow-up", minutes: 30 },
  { value: "Deep Cleaning", minutes: 60 },
  { value: "Filling", minutes: 45 },
  { value: "Crown", minutes: 90 },
  { value: "Root Canal", minutes: 90 },
  { value: "Extraction", minutes: 60 },
  { value: "Emergency / Tooth Pain", minutes: 30 },
] as const;

export const DEFAULT_PROCEDURE_MINUTES = 45;

/** Lengths offered in the booking dialog's "Length" select. */
export const DURATION_CHOICES = [15, 30, 45, 60, 90, 120] as const;
