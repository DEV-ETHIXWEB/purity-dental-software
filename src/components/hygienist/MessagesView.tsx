"use client";

import { useMemo, useState } from "react";
import { MessagesSquare } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { ConversationList } from "@/components/hygienist/ConversationList";
import { MessageThread } from "@/components/hygienist/MessageThread";
import { RecallAlertModal } from "@/components/hygienist/RecallAlertModal";
import {
  type SampleConversation,
  type SampleMessage,
  getPatientById,
  patientFullName,
  messagesForConversation,
} from "@/lib/sample-data";
import { cn } from "@/lib/cn";

export interface MessagesViewProps {
  conversations: SampleConversation[];
}

/**
 * Client-side conversation list + thread orchestrator. All message state
 * (new outgoing messages, unread counts, recall-alert sends) lives only in
 * React state for this session — there is no backend yet, so nothing here
 * persists across a reload.
 */
export function MessagesView({ conversations: initialConversations }: MessagesViewProps) {
  const [conversations, setConversations] = useState(initialConversations);
  const [selectedId, setSelectedId] = useState<string | null>(
    initialConversations[0]?.id ?? null,
  );
  const [extraMessages, setExtraMessages] = useState<Record<string, SampleMessage[]>>({});
  const [recallModalOpen, setRecallModalOpen] = useState(false);
  const [threadOpenOnMobile, setThreadOpenOnMobile] = useState(false);

  const selectedConversation = conversations.find((c) => c.id === selectedId) ?? null;
  const selectedPatient = selectedConversation ? getPatientById(selectedConversation.patientId) : null;

  const threadMessages = useMemo(() => {
    if (!selectedConversation) return [];
    const base = messagesForConversation(selectedConversation.id);
    const extra = extraMessages[selectedConversation.id] ?? [];
    return [...base, ...extra];
  }, [selectedConversation, extraMessages]);

  function handleSelect(conversationId: string) {
    setSelectedId(conversationId);
    setThreadOpenOnMobile(true);
    setConversations((prev) =>
      prev.map((c) => (c.id === conversationId ? { ...c, unreadCount: 0 } : c)),
    );
  }

  function handleSend(body: string) {
    if (!selectedConversation) return;
    const newMessage: SampleMessage = {
      id: `msg_local_${Date.now()}`,
      conversationId: selectedConversation.id,
      sender: "PROVIDER",
      body,
      sentAt: new Date().toISOString(),
    };
    setExtraMessages((prev) => ({
      ...prev,
      [selectedConversation.id]: [...(prev[selectedConversation.id] ?? []), newMessage],
    }));
  }

  return (
    <Card className="overflow-hidden">
      <div className="grid grid-cols-1 md:grid-cols-[minmax(0,280px)_1fr] md:divide-x md:divide-border">
        <div
          className={cn(
            "flex flex-col md:h-[calc(100vh-10rem)]",
            threadOpenOnMobile && "hidden md:flex",
          )}
        >
          <ConversationList
            conversations={conversations}
            selectedId={selectedId}
            onSelect={handleSelect}
          />
        </div>

        <div
          className={cn(
            "md:h-[calc(100vh-10rem)]",
            !threadOpenOnMobile && "hidden md:block",
          )}
        >
          {selectedConversation && selectedPatient ? (
            <div className="flex h-full flex-col">
              <button
                type="button"
                onClick={() => setThreadOpenOnMobile(false)}
                className="border-b border-border px-4 py-2 text-left text-xs font-medium text-text-secondary hover:text-text-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-brand-blue)] md:hidden"
              >
                ← All conversations
              </button>
              <MessageThread
                patient={selectedPatient}
                messages={threadMessages}
                onSend={handleSend}
                onSendRecallAlert={() => setRecallModalOpen(true)}
              />
            </div>
          ) : (
            <div className="flex h-full flex-col items-center justify-center gap-2 p-8 text-center">
              <MessagesSquare className="h-8 w-8 text-text-secondary" aria-hidden="true" />
              <p className="text-sm font-medium text-text-primary">Select a conversation</p>
              <p className="max-w-[240px] text-xs text-text-secondary">
                Choose a patient from the list to view and reply to their messages.
              </p>
            </div>
          )}
        </div>
      </div>

      {selectedPatient && (
        <RecallAlertModal
          open={recallModalOpen}
          onClose={() => setRecallModalOpen(false)}
          patientName={patientFullName(selectedPatient)}
        />
      )}
    </Card>
  );
}
