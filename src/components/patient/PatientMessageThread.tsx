"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { Send } from "lucide-react";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { VisuallyHiddenLabel } from "@/components/ui/Input";
import { EmptyState } from "@/components/patient/EmptyState";
import { ChatIconFilled } from "@/components/ui/icons/purity-icons";
import type { Message } from "@/generated/prisma/client";
import { cn } from "@/lib/cn";
import { formatClinicDateTime } from "@/lib/datetime";
import { useClinicTimeZone } from "@/components/shell/ClinicTimeZone";

function formatMessageTime(date: Date, timeZone: string) {
  return formatClinicDateTime(date, timeZone);
}

interface PatientMessageThreadProps {
  messages: Message[];
  patientFirstName: string;
  /**
   * Returns whether the send was accepted. A refusal keeps the draft in the
   * box and surfaces the reason — the server can reject a send the UI
   * believed was allowed (access revoked while this page sat open), and
   * silently swallowing that loses what the patient typed.
   */
  onSend: (body: string) => Promise<{ ok: boolean; error?: string }>;
  /**
   * Whether this patient is allowed to send. Granted by the front desk; when
   * false the composer is replaced by a short explanation rather than left
   * on screen to fail on submit. History stays readable either way.
   */
  canSend?: boolean;
}

/**
 * Patient-side message thread with their care team. Mirrors the Hygienist
 * portal's thread UI but from the opposite perspective: PATIENT-sent bubbles
 * align right, PROVIDER-sent bubbles align left. Sending persists via the
 * real `sendPatientMessage` Server Action (called by the parent view).
 */
export function PatientMessageThread({
  messages,
  patientFirstName,
  onSend,
  canSend = true,
}: PatientMessageThreadProps) {
  const timeZone = useClinicTimeZone();
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);
  const listEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    listEndRef.current?.scrollIntoView({ block: "end" });
  }, [messages.length]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const trimmed = draft.trim();
    if (!trimmed || sending) return;

    setSending(true);
    setSendError(null);
    try {
      const result = await onSend(trimmed);
      if (result.ok) {
        setDraft("");
      } else {
        setSendError(result.error ?? "Couldn't send this message. Please try again.");
      }
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-3 border-b border-border p-4">
        <Avatar name="Care team" size="sm" />
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-text-primary">Your care team</p>
          <p className="truncate text-xs text-text-secondary">Dentists, hygienists, and front desk staff</p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {messages.length === 0 ? (
          <div className="flex h-full items-center justify-center">
            <EmptyState
              icon={ChatIconFilled}
              title="No messages yet"
              description={
                canSend
                  ? "Send a message below and your care team will get back to you soon."
                  : "Messaging isn't switched on for your account yet."
              }
            />
          </div>
        ) : (
          <ul className="flex flex-col gap-3">
            {messages.map((message) => {
              const isMe = message.sender === "PATIENT";
              return (
                <li key={message.id} className={cn("flex flex-col", isMe ? "items-end" : "items-start")}>
                  <span className="mb-1 text-xs text-text-secondary">
                    {isMe ? patientFirstName : "Care team"} · {formatMessageTime(message.sentAt, timeZone)}
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
          </ul>
        )}
        <div ref={listEndRef} />
      </div>

      {!canSend ? (
        <div className="border-t border-border p-4">
          <p className="text-sm font-medium text-text-primary">Messaging isn&apos;t enabled yet</p>
          <p className="mt-1 text-sm text-text-secondary">
            Ask the front desk to turn on messaging for your account, and you&apos;ll be able to reach your
            hygienist from here. Call the practice in the meantime.
          </p>
        </div>
      ) : (
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
      )}
      {sendError && (
        <p role="alert" className="border-t border-border px-4 pb-4 text-sm text-error-text">
          {sendError}
        </p>
      )}
    </div>
  );
}
