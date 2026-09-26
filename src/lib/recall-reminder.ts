/**
 * Shared shape of a recall reminder, used by both the server action that
 * sends one and the client card that offers the button.
 *
 * In its own module (not the `"use server"` action, and not the
 * `server-only` data layer) because the Follow-ups card is a Client
 * Component and needs the cooldown window to word its own copy.
 */

/** Audit action written for every reminder. Doubles as the de-duplication key. */
export const RECALL_REMINDER_ACTION = "patient.recall_reminded";

/**
 * How long before the same patient can be reminded again.
 *
 * The button used to disable itself in local state only, so a page reload
 * re-armed it and the same patient could be sent the same reminder over and
 * over. A recall nudge is worth sending once a week at most; the server
 * enforces it against the audit trail rather than trusting the UI.
 */
export const RECALL_REMINDER_COOLDOWN_DAYS = 7;

export const RECALL_REMINDER_COOLDOWN_MS =
  RECALL_REMINDER_COOLDOWN_DAYS * 24 * 60 * 60 * 1000;

/**
 * The message body.
 *
 * Only invites a reply when the patient can actually send one — the front
 * desk controls that per patient (see `setMessagingAccess`), and telling
 * someone to "reply here" when their composer is disabled is a dead end.
 */
export function recallReminderBody(
  firstName: string,
  recallStatus: string | null,
  canReply: boolean,
): string {
  const reason = recallStatus ?? "your recall visit";
  const closing = canReply
    ? "Please reply here or call us to schedule."
    : "Please call the practice to schedule.";
  return `Hi ${firstName}, this is a friendly reminder that you're due for a follow-up (${reason}). ${closing}`;
}
