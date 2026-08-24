"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { MessagesSquare, Send } from "lucide-react";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { VisuallyHiddenLabel } from "@/components/ui/Input";
import { EmptyState } from "@/components/patient/EmptyState";
import { type SampleMessage, currentPatient, currentProvider } from "@/lib/sample-data";
import { cn } from "@/lib/cn";

function formatMessageTime(iso: string) {
  return new Date(iso).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

interface PatientMessageThreadProps {
  messages: SampleMessage[];
  onSend: (body: string) => void;
}

/**
 * Patient-side message thread with Sarah's care team. Mirrors the Hygienist
 * portal's thread UI but from the opposite perspective: PATIENT-sent bubbles
 * align right, PROVIDER-sent bubbles align left. Sending updates local state
 * optimistically via `onSend` — there's no backend yet.
 */
export function PatientMessageThread({ messages, onSend }: PatientMessageThreadProps) {
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const listEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    listEndRef.current?.scrollIntoView({ block: "end" });
  }, [messages.length]);

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const trimmed = draft.trim();
    if (!trimmed) return;

    setSending(true);
    window.setTimeout(() => {
      onSend(trimmed);
      setDraft("");
      setSending(false);
    }, 300);
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-3 border-b border-border p-4">
        <Avatar name={currentProvider.name} size="sm" />
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-text-primary">Your care team</p>
          <p className="truncate text-xs text-text-secondary">{currentProvider.name} and staff</p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {messages.length === 0 ? (
          <div className="flex h-full items-center justify-center">
            <EmptyState
              icon={MessagesSquare}
              title="No messages yet"
              description="Send a message below and your care team will get back to you soon."
            />
          </div>
        ) : (
          <ul className="flex flex-col gap-3">
            {messages.map((message) => {
              const isMe = message.sender === "PATIENT";
              return (
                <li key={message.id} className={cn("flex flex-col", isMe ? "items-end" : "items-start")}>
                  <span className="mb-1 text-xs text-text-secondary">
                    {isMe ? currentPatient.firstName : currentProvider.name} · {formatMessageTime(message.sentAt)}
                  </span>
                  <div
                    className={cn(
                      "max-w-[85%] rounded-[var(--radius-lg)] px-4 py-2.5 text-sm sm:max-w-[70%]",
                      isMe ? "brand-gradient-bg text-white" : "bg-surface-muted text-text-primary",
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
          <VisuallyHiddenLabel htmlFor="patient-message-composer">Message your care team</VisuallyHiddenLabel>
          <textarea
            id="patient-message-composer"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSubmit(e);
              }
            }}
            rows={1}
            placeholder="Type a message…"
            className="w-full resize-none rounded-[var(--radius-md)] border border-border bg-surface px-3 py-2.5 text-sm text-text-primary placeholder:text-text-secondary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-brand-blue)]"
          />
        </div>
        <Button
          type="submit"
          size="icon"
          className="min-h-11 min-w-11"
          aria-label="Send message"
          disabled={!draft.trim() || sending}
        >
          <Send className="h-4 w-4" aria-hidden="true" />
        </Button>
      </form>
    </div>
  );
}
