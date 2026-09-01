import type { Metadata } from "next";
import { Badge } from "@/components/ui/Badge";
import { PatientMessagesView } from "./PatientMessagesView";
import { conversationForPatient, currentPatient, messagesForConversation } from "@/lib/sample-data";

export const metadata: Metadata = {
  title: "Messages",
  description: "Message your care team and see your conversation history.",
};

export default function PatientMessagesPage() {
  const conversation = conversationForPatient(currentPatient.id);
  const messages = conversation ? messagesForConversation(conversation.id) : [];

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-text-primary">Messages</h1>
          <p className="text-sm text-text-secondary">Reach your care team any time — we usually reply within a day.</p>
        </div>
        {conversation && conversation.unreadCount > 0 && (
          <Badge tone="brand-blue">{conversation.unreadCount} new</Badge>
        )}
      </div>

      <PatientMessagesView initialMessages={messages} />
    </div>
  );
}
