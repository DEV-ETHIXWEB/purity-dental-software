import "server-only";
import { listConversations, conversationForPatient, messagesForConversation } from "@/lib/data/messaging";
import { listFollowUps } from "@/lib/data/patients";
import { listInvoices, listInvoicesForPatient } from "@/lib/data/billing";
import { appointmentsForPatient } from "@/lib/data/appointments";
import { patientFullName } from "@/lib/patient-format";
import { invoiceNumber } from "@/lib/billing-format";
import type { ShellNotification } from "@/components/shell/types";

/**
 * Notifications are *derived*, not stored — there is no Notification model,
 * and inventing one's worth of fake rows would put fabricated data in front
 * of clinicians. Everything here is a real, already-queried signal
 * (unanswered patient messages, patients past their recall date, overdue
 * invoices, a patient's own next visit) reshaped into one feed.
 *
 * Consequence worth knowing: there is no per-user read state, so "unread"
 * means "still outstanding". An item disappears when the underlying thing is
 * actually dealt with — a message answered, an invoice paid — which is
 * honest, but means the bell can't be dismissed to zero on its own.
 */

/** Routes differ per portal, so callers pass the ones their nav actually has. */
export interface NotificationRoutes {
  messagesHref?: string;
  patientsHref: string;
  billingHref?: string;
  appointmentsHref?: string;
}

const MAX_ITEMS = 6;

/** Server-formatted so the client renders a plain string — no clock-skew hydration mismatch. */
function relativeTime(date: Date, now: Date): string {
  const minutes = Math.round((now.getTime() - date.getTime()) / 60000);
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days}d ago`;
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

/** Same shape for a future date ("in 3 days"), used for the patient's next visit. */
function relativeFuture(date: Date, now: Date): string {
  const days = Math.ceil((date.getTime() - now.getTime()) / 86400000);
  if (days <= 0) return "Today";
  if (days === 1) return "Tomorrow";
  if (days < 7) return `In ${days} days`;
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function newest(items: ShellNotification[]): ShellNotification[] {
  return items.sort((a, b) => b.sortKey - a.sortKey).slice(0, MAX_ITEMS);
}

/**
 * Staff feed (Dentist, Hygienist, Receptionist): what needs a response
 * today — unanswered patient messages, patients past recall, overdue money.
 */
export async function staffNotifications(
  organizationId: string,
  routes: NotificationRoutes,
): Promise<ShellNotification[]> {
  const now = new Date();
  const [conversations, followUps, invoices] = await Promise.all([
    listConversations(organizationId),
    listFollowUps(organizationId),
    listInvoices(organizationId),
  ]);

  const items: ShellNotification[] = [];

  if (routes.messagesHref) {
    for (const conversation of conversations) {
      if (conversation.unreadCount === 0) continue;
      const last = conversation.messages[conversation.messages.length - 1];
      const at = last?.sentAt ?? conversation.updatedAt;
      items.push({
        id: `msg-${conversation.id}`,
        kind: "message",
        title: `New message from ${patientFullName(conversation.patient)}`,
        meta: relativeTime(at, now),
        href: routes.messagesHref,
        sortKey: at.getTime(),
        unread: true,
      });
    }
  }

  for (const patient of followUps) {
    items.push({
      id: `recall-${patient.id}`,
      kind: "recall",
      title: `${patientFullName(patient)} is due for recall`,
      meta: patient.recallStatus ?? "Recall due",
      href: `${routes.patientsHref}/${patient.id}`,
      // Recalls have no event timestamp; anchor them just behind live
      // messages so a genuinely new message always sorts above them.
      sortKey: now.getTime() - 60 * 60000,
      unread: true,
    });
  }

  if (routes.billingHref) {
    for (const invoice of invoices.filter((i) => i.status === "OVERDUE")) {
      items.push({
        id: `inv-${invoice.id}`,
        kind: "billing",
        title: `Invoice ${invoiceNumber(invoice)} is overdue`,
        meta: `${patientFullName(invoice.patient)} · ${relativeTime(invoice.issuedAt, now)}`,
        href: `${routes.billingHref}/invoices/${invoice.id}`,
        sortKey: invoice.issuedAt.getTime(),
        unread: true,
      });
    }
  }

  return newest(items);
}

/**
 * Patient feed: their own next visit, replies from the practice, and any
 * bill still owing.
 */
export async function patientNotifications(
  organizationId: string,
  patientId: string,
  routes: NotificationRoutes,
): Promise<ShellNotification[]> {
  const now = new Date();
  const [conversation, invoices, appointments] = await Promise.all([
    conversationForPatient(organizationId, patientId),
    listInvoicesForPatient(organizationId, patientId),
    appointmentsForPatient(organizationId, patientId),
  ]);

  const items: ShellNotification[] = [];

  if (routes.messagesHref && conversation) {
    // `conversationForPatient` returns the thread row only, so the messages
    // are a second read — same pair `hasUnreadForPatient` does.
    const messages = await messagesForConversation(organizationId, conversation.id);
    // Provider replies since this patient last wrote — the mirror of the
    // staff-side unread rule in `listConversations`.
    let lastPatientAt = new Date(0);
    for (const message of messages) {
      if (message.sender === "PATIENT" && message.sentAt > lastPatientAt) lastPatientAt = message.sentAt;
    }
    const replies = messages.filter((m) => m.sender === "PROVIDER" && m.sentAt > lastPatientAt);
    const latest = replies[replies.length - 1];
    if (latest) {
      items.push({
        id: `msg-${conversation.id}`,
        kind: "message",
        title: "New message from your care team",
        meta: relativeTime(latest.sentAt, now),
        href: routes.messagesHref,
        sortKey: latest.sentAt.getTime(),
        unread: true,
      });
    }
  }

  if (routes.appointmentsHref) {
    const next = appointments
      .filter((a) => a.status !== "CANCELLED" && a.startTime >= now)
      .sort((a, b) => a.startTime.getTime() - b.startTime.getTime())[0];
    if (next) {
      items.push({
        id: `appt-${next.id}`,
        kind: "appointment",
        title: `${next.procedureType} appointment`,
        meta: relativeFuture(next.startTime, now),
        href: routes.appointmentsHref,
        sortKey: now.getTime(),
        unread: false,
      });
    }
  }

  if (routes.billingHref) {
    for (const invoice of invoices.filter((i) => i.status === "OVERDUE" || i.status === "PENDING")) {
      items.push({
        id: `inv-${invoice.id}`,
        kind: "billing",
        title:
          invoice.status === "OVERDUE"
            ? `Invoice ${invoiceNumber(invoice)} is overdue`
            : `Invoice ${invoiceNumber(invoice)} is due`,
        meta: relativeTime(invoice.issuedAt, now),
        href: routes.billingHref,
        sortKey: invoice.issuedAt.getTime(),
        unread: invoice.status === "OVERDUE",
      });
    }
  }

  return newest(items);
}
