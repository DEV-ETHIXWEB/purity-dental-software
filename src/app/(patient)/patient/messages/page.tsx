import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Badge } from "@/components/ui/Badge";
import { PatientMessagesView } from "./PatientMessagesView";
import { requireRole } from "@/lib/auth/authorize";
import { getPatientForUser } from "@/lib/data/patients";
import { conversationForPatient, messagesForConversation } from "@/lib/data/messaging";

export const metadata: Metadata = {
  title: "Messages",
  description: "Message your care team and see your conversation history.",
};

export default async function PatientMessagesPage() {
  const session = await requireRole(["PATIENT"]);
  const patient = await getPatientForUser(session.user.id);
  if (!patient) notFound();

  const conversation = await conversationForPatient(session.user.organizationId, patient.id);
  const messages = conversation
    ? await messagesForConversation(session.user.organizationId, conversation.id)
    : [];

  // "Unread" here approximates PROVIDER messages sent after the patient's own last message —
  // there's no read-receipt table, so this is a best-effort signal, not a persisted read state.
  let lastPatientAt = new Date(0);
  for (const m of messages) {
    if (m.sender === "PATIENT" && m.sentAt > lastPatientAt) lastPatientAt = m.sentAt;
  }
  const unreadCount = messages.filter((m) => m.sender === "PROVIDER" && m.sentAt > lastPatientAt).length;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-text-primary">Messages</h1>
          <p className="text-sm text-text-secondary">Reach your care team any time — we usually reply within a day.</p>
        </div>
        {unreadCount > 0 && <Badge tone="brand-blue">{unreadCount} new</Badge>}
      </div>

      <PatientMessagesView initialMessages={messages} patientId={patient.id} patientFirstName={patient.firstName} />
    </div>
  );
}
