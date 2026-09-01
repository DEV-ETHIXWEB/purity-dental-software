"use client";

import { useEffect, useRef, useState } from "react";
import { Send, MessagesSquare, BellRing } from "lucide-react";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { VisuallyHiddenLabel } from "@/components/ui/Input";
import {
  type SampleMessage,
  type SamplePatient,
  patientFullName,
  currentHygienist,
} from "@/lib/sample-data";
import { cn } from "@/lib/cn";

function formatMessageTime(iso: string) {
  return new Date(iso).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export interface MessageThreadProps {
  patient: SamplePatient;
  messages: SampleMessage[];
  onSend: (body: string) => void;
  onSendRecallAlert: () => void;
}

/**
 * Message bubble thread + composer for a single conversation. Sending a
 * message updates the caller's local state optimistically (via `onSend`) —
 * there is no backend, so nothing here persists across a page reload.
 */
export function MessageThread({ patient, messages, onSend, onSendRecallAlert }: MessageThreadProps) {
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const listEndRef = useRef<HTMLDivElement>(null);
  const name = patientFullName(patient);
  const isOverdue = patient.recallStatus.toLowerCase().includes("overdue");

  useEffect(() => {
    listEndRef.current?.scrollIntoView({ block: "end" });
  }, [messages.length]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = draft.trim();
    if (!trimmed) return;

    setSending(true);
    // Simulated send latency so the UI shows a real (if brief) loading state
    // rather than an instant, decorative update.
    window.setTimeout(() => {
      onSend(trimmed);
      setDraft("");
      setSending(false);
    }, 300);
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between gap-3 border-b border-border p-4">
        <div className="flex min-w-0 items-center gap-3">
          <Avatar name={name} src={patient.photoUrl} size="sm" />
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-text-primary">{name}</p>
            <p className="truncate text-xs text-text-secondary">{patient.phone}</p>
          </div>
        </div>
        {isOverdue && (
          <Button variant="outline" size="sm" onClick={onSendRecallAlert}>
            <BellRing className="h-4 w-4" aria-hidden="true" />
            Send Recall Alert
          </Button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {messages.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center gap-2 text-center">
            <MessagesSquare className="h-8 w-8 text-text-secondary" aria-hidden="true" />
            <p className="text-sm font-medium text-text-primary">No messages yet</p>
            <p className="max-w-[220px] text-xs text-text-secondary">
              Start the conversation with {name} below.
            </p>
          </div>
        ) : (
          <ul className="flex flex-col gap-3">
            {messages.map((message) => {
              const isProvider = message.sender === "PROVIDER";
              return (
                <li
                  key={message.id}
                  className={cn("flex flex-col", isProvider ? "items-end" : "items-start")}
                >
                  <span className="mb-1 text-xs text-text-secondary">
                    {isProvider ? currentHygienist.name : name} ·{" "}
                    {formatMessageTime(message.sentAt)}
                  </span>
                  <div
                    className={cn(
                      "max-w-[85%] rounded-[var(--radius-lg)] px-4 py-2.5 text-sm sm:max-w-[70%]",
                      isProvider
                        ? "brand-gradient-bg text-white"
                        : "bg-surface-muted text-text-primary",
                    )}
                  >
                    {message.body}
                  </div>
                </li>
              );
            })}
            <div ref={listEndRef} />
          </ul>
        )}
      </div>

      <form onSubmit={handleSubmit} className="flex items-end gap-2 border-t border-border p-4">
        <div className="flex-1">
          <VisuallyHiddenLabel htmlFor="message-composer">
            Message to {name}
          </VisuallyHiddenLabel>
          <textarea
            id="message-composer"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSubmit(e);
              }
            }}
            rows={1}
            placeholder={`Message ${name}…`}
            className="w-full resize-none rounded-[var(--radius-md)] border border-border bg-surface px-3 py-2.5 text-sm text-text-primary placeholder:text-text-secondary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-brand-blue)]"
          />
        </div>
        <Button type="submit" size="icon" aria-label="Send message" disabled={!draft.trim() || sending}>
          <Send className="h-4 w-4" aria-hidden="true" />
        </Button>
      </form>
    </div>
  );
}
