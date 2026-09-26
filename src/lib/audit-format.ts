/**
 * Turns an audit `action` key into something a person reads.
 *
 * The keys are written by the actions that record them (`appointment.moved`,
 * `staff.permission_changed`) and are deliberately machine-shaped: stable,
 * greppable, safe to filter on. This is the display layer for them.
 *
 * Unknown keys fall back to a humanised form of the key itself rather than
 * being hidden, so an action added later still reads sensibly in the log
 * before anyone remembers to add it here.
 */
const ACTION_LABELS: Record<string, string> = {
  "appointment.booked": "Booked an appointment",
  "appointment.moved": "Moved an appointment",
  "appointment.resolved": "Resolved an appointment",
  "appointment.cancelled": "Cancelled an appointment",
  "appointment.rescheduled": "Rescheduled an appointment",
  "invoice.marked_paid": "Marked an invoice paid",
  "invoice.created": "Created an invoice",
  "invoice.updated": "Updated an invoice",
  "patient.created": "Registered a patient",
  "patient.updated": "Updated patient details",
  "patient.status_changed": "Changed a patient's status",
  "patient.messaging_granted": "Gave a patient messaging access",
  "patient.messaging_revoked": "Removed a patient's messaging access",
  "practice.updated": "Updated practice settings",
  "staff.created": "Added a staff member",
  "staff.updated": "Updated a staff member",
  "staff.role_changed": "Changed a staff member's role",
  "staff.deactivated": "Deactivated an account",
  "staff.reactivated": "Reactivated an account",
  "staff.password_reset": "Reset a staff password",
  "staff.permission_changed": "Changed a staff member's permissions",
};

export function describeAuditAction(action: string): string {
  const known = ACTION_LABELS[action];
  if (known) return known;

  // "some_area.did_a_thing" → "Did a thing"
  const tail = action.includes(".") ? action.slice(action.indexOf(".") + 1) : action;
  const words = tail.replace(/_/g, " ").trim();
  return words ? words.charAt(0).toUpperCase() + words.slice(1) : action;
}

/** The top-level area an action belongs to, used to group and filter the log. */
export function auditActionArea(action: string): string {
  return action.includes(".") ? action.slice(0, action.indexOf(".")) : "other";
}
