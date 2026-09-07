"use client";

import { ChatIconFilled } from "@/components/ui/icons/purity-icons";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { RecallStatusBadge } from "@/components/dentist/PatientStatusBadge";
import { patientFullName } from "@/lib/patient-format";
import type { ConversationWithUnread } from "@/lib/data/messaging";
import { cn } from "@/lib/cn";

function formatTimestamp(date: Date) {
  const now = new Date();
  const isToday = date.toDateString() === now.toDateString();
  return isToday
    ? date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })
    : date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export interface ConversationListProps {
  conversations: ConversationWithUnread[];
  selectedId: string | null;
  onSelect: (conversationId: string) => void;
}

export function ConversationList({ conversations, selectedId, onSelect }: ConversationListProps) {
  if (conversations.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 px-4 py-12 text-center">
        <ChatIconFilled className="h-8 w-8" aria-hidden="true" />
        <p className="text-sm font-medium text-text-primary">No conversations yet</p>
        <p className="max-w-[220px] text-xs text-text-secondary">
          Messages from patients will show up here once they reach out.
        </p>
      </div>
    );
  }

  return (
    <ul aria-label="Conversations" className="flex flex-col divide-y divide-border">
      {conversations.map((conversation) => {
        const patient = conversation.patient;
        const name = patientFullName(patient);
        const last = conversation.messages[conversation.messages.length - 1] ?? null;
        const isSelected = conversation.id === selectedId;
        const isOverdue = (patient.recallStatus ?? "").toLowerCase().includes("overdue");

        return (
          <li key={conversation.id}>
            <button
              type="button"
              aria-current={isSelected ? "true" : undefined}
              onClick={() => onSelect(conversation.id)}
              className={cn(
                "flex w-full items-start gap-3 px-4 py-3 text-left transition-colors",
                "focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-[var(--color-brand-blue)]",
                isSelected ? "bg-info-bg" : "hover:bg-surface-muted",
              )}
            >
              <Avatar name={name} src={patient.photoUrl} size="sm" />
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <p className="truncate text-sm font-medium text-text-primary">{name}</p>
                  {last && (
                    <span className="shrink-0 text-xs text-text-secondary">
                      {formatTimestamp(last.sentAt)}
                    </span>
                  )}
                </div>
                <p className="truncate text-xs text-text-secondary">
                  {last ? last.body : "No messages yet"}
                </p>
                <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                  {conversation.unreadCount > 0 && (
                    <Badge tone="brand-blue">{conversation.unreadCount} new</Badge>
                  )}
                  {isOverdue && <RecallStatusBadge status={patient.recallStatus} />}
                </div>
              </div>
            </button>
          </li>
        );
      })}
    </ul>
  );
}
