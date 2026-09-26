"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/cn";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { patientFullName } from "@/lib/patient-format";
import { sendRecallReminder } from "@/lib/actions/send-recall-reminder";
import { RECALL_REMINDER_COOLDOWN_DAYS } from "@/lib/recall-reminder";
import type { Patient } from "@/generated/prisma/client";

export interface FollowUpsCardProps {
  /** Patients needing outreach — see `listFollowUps` in src/lib/data/patients.ts. `recallStatus` doubles as the reason shown. */
  patients: Patient[];
  /**
   * Ids already reminded inside the cooldown, from
   * `recentlyRemindedPatientIds`. Without it the button would read "Remind"
   * again after any reload and invite a send the server will refuse.
   */
  remindedPatientIds?: string[];
}

/**
 * `confirming` is the second step of the send.
 *
 * "Remind" posts a real message to a patient. It used to do that on a single
 * click with no confirmation and no undo, sitting directly beside the
 * patient's name in a list — an easy mis-click. The button now asks once.
 */
type SendState = "idle" | "confirming" | "sending" | "sent" | "error";

const STAGGER = ["stagger-0", "stagger-1", "stagger-2", "stagger-3", "stagger-4", "stagger-5"];

/**
 * "Remind" sends a real message on the patient's conversation thread via
 * `sendPatientMessage` (the same action backing the Messages page) rather
 * than just flipping local UI state — a button that visibly says "Sent"
 * without actually notifying anyone would be misleading.
 */
export function FollowUpsCard({ patients, remindedPatientIds = [] }: FollowUpsCardProps) {
  const [status, setStatus] = useState<Record<string, SendState>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const alreadyReminded = new Set(remindedPatientIds);

  function stateFor(patientId: string): SendState {
    return status[patientId] ?? (alreadyReminded.has(patientId) ? "sent" : "idle");
  }

  async function handleRemind(patient: Patient) {
    const state = stateFor(patient.id);

    // First press arms; second press sends.
    if (state === "idle" || state === "error") {
      setStatus((prev) => ({ ...prev, [patient.id]: "confirming" }));
      return;
    }
    if (state !== "confirming") return;

    setStatus((prev) => ({ ...prev, [patient.id]: "sending" }));
    const result = await sendRecallReminder(patient.id);

    if (result.ok || result.alreadySent) {
      // A refusal because one already went out still leaves the patient
      // reminded, so the button settles on "Sent" either way rather than
      // inviting another press that would be refused again.
      setStatus((prev) => ({ ...prev, [patient.id]: "sent" }));
      setErrors((prev) => {
        const next = { ...prev };
        if (result.alreadySent && result.error) next[patient.id] = result.error;
        else delete next[patient.id];
        return next;
      });
    } else {
      setStatus((prev) => ({ ...prev, [patient.id]: "error" }));
      setErrors((prev) => ({ ...prev, [patient.id]: result.error ?? "Couldn't send that reminder." }));
    }
  }

  return (
    <Card className="animate-rise-in stagger-4 flex h-full flex-col transition-shadow duration-300 ease-out hover:shadow-card-hover">
      <CardHeader>
        <CardTitle>Follow-ups</CardTitle>
        <span className="text-xs text-text-secondary">
          Once every {RECALL_REMINDER_COOLDOWN_DAYS} days
        </span>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {patients.length === 0 && (
          <p className="text-sm text-text-secondary">No patients need follow-up right now.</p>
        )}
        {patients.map((patient, i) => {
          const name = patientFullName(patient);
          const state = stateFor(patient.id);

          return (
            <div
              key={patient.id}
              className={cn(
                "group/row animate-rise-in -mx-2 flex min-w-0 flex-wrap items-center justify-between gap-x-3 gap-y-2 rounded-[var(--radius-md)] px-2 py-1.5",
                "transition-colors duration-200 ease-out hover:bg-surface-muted",
                STAGGER[i] ?? "stagger-5",
              )}
            >
              <div className="flex min-w-0 flex-1 basis-36 items-center gap-3">
                <Avatar
                  name={name}
                  src={patient.photoUrl}
                  size="sm"
                  className="transition-transform duration-200 ease-out group-hover/row:-translate-y-0.5 motion-reduce:group-hover/row:translate-y-0"
                />
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-text-primary">{name}</p>
                  <p className="truncate text-xs text-text-secondary">{patient.recallStatus}</p>
                </div>
              </div>
              <div className="flex shrink-0 flex-col items-end gap-1">
                <Button
                  size="sm"
                  variant={state === "confirming" ? "primary" : state === "sent" ? "secondary" : "outline"}
                  className="transition-all duration-200 ease-out hover:shadow-card active:scale-[0.97] motion-reduce:active:scale-100"
                  onClick={() => handleRemind(patient)}
                  disabled={state === "sending" || state === "sent"}
                  aria-label={
                    state === "confirming"
                      ? `Confirm sending a reminder to ${name}`
                      : `Send reminder to ${name}`
                  }
                >
                  {state === "sending" && (
                    <Loader2 className="h-4 w-4 animate-spin motion-reduce:animate-none" aria-hidden="true" />
                  )}
                  {state === "sending"
                    ? "Sending…"
                    : state === "sent"
                      ? <span className="animate-pop-in">Reminded</span>
                      : state === "confirming"
                        ? "Send it?"
                        : state === "error"
                          ? "Try again"
                          : "Remind"}
                </Button>
                {state === "confirming" && (
                  <span className="text-[11px] text-text-secondary">
                    Messages {patient.firstName} directly
                  </span>
                )}
                {errors[patient.id] && (
                  <span
                    role="status"
                    className={cn(
                      "max-w-[14rem] text-right text-[11px]",
                      state === "error" ? "text-error-text" : "text-text-secondary",
                    )}
                  >
                    {errors[patient.id]}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
