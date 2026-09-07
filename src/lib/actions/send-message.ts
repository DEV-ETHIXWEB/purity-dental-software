"use server";

import { requireSession } from "@/lib/auth/authorize";
import { getPatientById } from "@/lib/data/patients";
import { sendMessage } from "@/lib/data/messaging";

export interface SendMessageResult {
  ok: boolean;
  error?: string;
}

/**
 * Sends a message on a patient's conversation thread — backs both the
 * Hygienist "Communication tab" (staff → patient) and the Patient portal's
 * Messages page (patient → staff). Which `sender` value is allowed depends
 * on who's signed in: a PATIENT-role user may only send as PATIENT on their
 * own conversation; any staff role may only send as PROVIDER.
 */
export async function sendPatientMessage(patientId: string, body: string): Promise<SendMessageResult> {
  const trimmed = body.trim();
  if (!trimmed) return { ok: false, error: "Message can't be empty." };

  try {
    const session = await requireSession();
    const patient = await getPatientById(session.user.organizationId, patientId);
    if (!patient) return { ok: false, error: "Patient not found." };

    if (session.user.role === "PATIENT") {
      if (patient.userId !== session.user.id) {
        return { ok: false, error: "You can only message from your own account." };
      }
      await sendMessage({
        organizationId: session.user.organizationId,
        patientId,
        sender: "PATIENT",
        body: trimmed,
      });
    } else {
      await sendMessage({
        organizationId: session.user.organizationId,
        patientId,
        sender: "PROVIDER",
        senderUserId: session.user.id,
        body: trimmed,
      });
    }

    return { ok: true };
  } catch {
    return { ok: false, error: "Couldn't send this message. Please try again." };
  }
}
