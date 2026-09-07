"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ChatIconFilled } from "@/components/ui/icons/purity-icons";
import { Card } from "@/components/ui/Card";
import { ConversationList } from "@/components/hygienist/ConversationList";
import { MessageThread } from "@/components/hygienist/MessageThread";
import { RecallAlertModal } from "@/components/hygienist/RecallAlertModal";
import { sendPatientMessage } from "@/lib/actions/send-message";
import { patientFullName } from "@/lib/patient-format";
import type { ConversationWithUnread } from "@/lib/data/messaging";
import { cn } from "@/lib/cn";

export interface MessagesViewProps {
  conversations: ConversationWithUnread[];
  currentUserName: string;
}

/**
 * Client-side conversation list + thread orchestrator, backed by real
 * `Conversation`/`Message` rows (see `src/lib/data/messaging.ts` and the
 * `sendPatientMessage` Server Action). Local `unreadCount` overrides are
 * still client-only (marking a thread "read" on open) — there's no
 * read-receipt table, so this just hides the badge for the rest of the
 * session rather than persisting read state.
 */
export function MessagesView({ conversations: initialConversations, currentUserName }: MessagesViewProps) {
  const router = useRouter();
  const [conversations, setConversations] = useState(initialConversations);
  const [selectedId, setSelectedId] = useState<string | null>(
    initialConversations[0]?.id ?? null,
  );
  const [recallModalOpen, setRecallModalOpen] = useState(false);
  const [threadOpenOnMobile, setThreadOpenOnMobile] = useState(false);

  const selectedConversation = conversations.find((c) => c.id === selectedId) ?? null;
  const selectedPatient = selectedConversation?.patient ?? null;

  function handleSelect(conversationId: string) {
    setSelectedId(conversationId);
    setThreadOpenOnMobile(true);
    setConversations((prev) =>
      prev.map((c) => (c.id === conversationId ? { ...c, unreadCount: 0 } : c)),
    );
  }

  async function handleSend(body: string) {
    if (!selectedConversation) return;
    const result = await sendPatientMessage(selectedConversation.patientId, body);
    if (result.ok) router.refresh();
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
                messages={selectedConversation.messages}
                currentUserName={currentUserName}
                onSend={handleSend}
                onSendRecallAlert={() => setRecallModalOpen(true)}
              />
            </div>
          ) : (
            <div className="flex h-full flex-col items-center justify-center gap-2 p-8 text-center">
              <ChatIconFilled className="h-8 w-8" aria-hidden="true" />
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
