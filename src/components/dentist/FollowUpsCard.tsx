"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/cn";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { patientFullName } from "@/lib/patient-format";
import { sendPatientMessage } from "@/lib/actions/send-message";
import type { Patient } from "@/generated/prisma/client";

export interface FollowUpsCardProps {
  /** Patients needing outreach — see `listFollowUps` in src/lib/data/patients.ts. `recallStatus` doubles as the reason shown. */
  patients: Patient[];
}

type SendState = "idle" | "sending" | "sent" | "error";

const STAGGER = ["stagger-0", "stagger-1", "stagger-2", "stagger-3", "stagger-4", "stagger-5"];

/**
 * "Remind" sends a real message on the patient's conversation thread via
 * `sendPatientMessage` (the same action backing the Messages page) rather
 * than just flipping local UI state — a button that visibly says "Sent"
 * without actually notifying anyone would be misleading.
 */
export function FollowUpsCard({ patients }: FollowUpsCardProps) {
  const [status, setStatus] = useState<Record<string, SendState>>({});

  async function handleRemind(patient: Patient) {
    setStatus((prev) => ({ ...prev, [patient.id]: "sending" }));
    const reason = patient.recallStatus ?? "your recall visit";
    const result = await sendPatientMessage(
      patient.id,
      `Hi ${patient.firstName}, this is a friendly reminder that you're due for a follow-up (${reason}). Please reply here or call us to schedule.`,
    );
    setStatus((prev) => ({ ...prev, [patient.id]: result.ok ? "sent" : "error" }));
  }

  return (
    <Card className="animate-rise-in stagger-4 transition-shadow duration-300 ease-out hover:shadow-card-hover">
      <CardHeader>
        <CardTitle>Follow-ups</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {patients.length === 0 && (
          <p className="text-sm text-text-secondary">No patients need follow-up right now.</p>
        )}
        {patients.map((patient, i) => {
          const name = patientFullName(patient);
          const state = status[patient.id] ?? "idle";

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
              <Button
                size="sm"
                variant={state === "sent" ? "secondary" : "outline"}
                className="shrink-0 transition-all duration-200 ease-out hover:shadow-card active:scale-[0.97] motion-reduce:active:scale-100"
                onClick={() => handleRemind(patient)}
                disabled={state === "sending" || state === "sent"}
                aria-label={`Send reminder to ${name}`}
              >
                {state === "sending" && (
                  <Loader2 className="h-4 w-4 animate-spin motion-reduce:animate-none" aria-hidden="true" />
                )}
                {state === "sending"
                  ? "Sending…"
                  : state === "sent"
                    ? <span className="animate-pop-in">Sent</span>
                    : state === "error"
                      ? "Try again"
                      : "Remind"}
              </Button>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
