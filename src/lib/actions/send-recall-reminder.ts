"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/auth/authorize";
import { writeAuditLog } from "@/lib/auth/audit-log";
import { sendMessage } from "@/lib/data/messaging";
import {
  RECALL_REMINDER_ACTION,
  RECALL_REMINDER_COOLDOWN_DAYS,
  RECALL_REMINDER_COOLDOWN_MS,
  recallReminderBody,
} from "@/lib/recall-reminder";

export interface SendRecallReminderResult {
  ok: boolean;
  error?: string;
  /** True when the send was refused because one went out recently. */
  alreadySent?: boolean;
}

/**
 * Sends a recall reminder on a patient's care-team thread.
 *
 * Split out of the generic `sendPatientMessage` the Follow-ups card used to
 * call, for two reasons:
 *
 *  - It de-duplicates. The card disabled its own button after a send, but
 *    that lived in local state, so a refresh re-armed it and the same
 *    patient could be sent the same nudge repeatedly. The cooldown is
 *    checked here against the audit trail, which survives reloads, other
 *    tabs and other staff members.
 *  - It leaves a record. A message in the thread says a reminder was sent;
 *    it doesn't say who pressed the button. The audit row does, and it is
 *    what the cooldown reads back.
 *
 * Gated on `messaging.reply` rather than a role list so an admin can decide
 * who chases recalls.
 */
export async function sendRecallReminder(patientId: string): Promise<SendRecallReminderResult> {
  try {
    const session = await requirePermission("messaging.reply");
    const organizationId = session.user.organizationId;

    const patient = await prisma.patient.findFirst({
      where: { id: patientId, organizationId },
      select: { id: true, firstName: true, recallStatus: true, canMessageCareTeam: true },
    });
    if (!patient) return { ok: false, error: "That patient is no longer in this practice." };

    const recent = await prisma.auditLog.findFirst({
      where: {
        organizationId,
        action: RECALL_REMINDER_ACTION,
        resourceId: patient.id,
        createdAt: { gte: new Date(Date.now() - RECALL_REMINDER_COOLDOWN_MS) },
      },
      select: { id: true },
    });
    if (recent) {
      return {
        ok: false,
        alreadySent: true,
        error: `${patient.firstName} was already reminded in the last ${RECALL_REMINDER_COOLDOWN_DAYS} days.`,
      };
    }

    await sendMessage({
      organizationId,
      patientId: patient.id,
      sender: "PROVIDER",
      senderUserId: session.user.id,
      body: recallReminderBody(patient.firstName, patient.recallStatus, patient.canMessageCareTeam),
    });

    await writeAuditLog({
      organizationId,
      actorUserId: session.user.id,
      action: RECALL_REMINDER_ACTION,
      resourceType: "Patient",
      resourceId: patient.id,
      metadata: { recallStatus: patient.recallStatus },
    });

    for (const path of [
      "/dashboard",
      "/hygienist/dashboard",
      "/receptionist/dashboard",
      "/hygienist/messages",
      "/patient/messages",
    ]) {
      revalidatePath(path);
    }

    return { ok: true };
  } catch {
    return { ok: false, error: "Couldn't send that reminder. Please try again." };
  }
}
