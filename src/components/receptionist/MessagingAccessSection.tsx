"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { setMessagingAccess } from "@/lib/actions/set-messaging-access";
import { cn } from "@/lib/cn";

export interface MessagingAccessSectionProps {
  patientId: string;
  patientFirstName: string;
  allowed: boolean;
}

/**
 * Front-desk control over whether a patient can message the care team.
 *
 * Sits in the patient profile's detail card rather than the patients list:
 * it's a per-patient decision someone makes while looking at that patient,
 * not something to flip in bulk down a table.
 *
 * Saves on change with no Save button — one value, nothing to review before
 * committing — matching the notification switches in Settings.
 */
export function MessagingAccessSection({
  patientId,
  patientFirstName,
  allowed: initialAllowed,
}: MessagingAccessSectionProps) {
  const router = useRouter();
  const [allowed, setAllowed] = useState(initialAllowed);
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");

  async function toggle(next: boolean) {
    // Applied first so the switch answers the tap immediately; rolled back
    // below if the write fails, rather than leaving a lie on screen.
    const previous = allowed;
    setAllowed(next);
    setStatus("saving");

    const result = await setMessagingAccess({ patientId, allowed: next });
    if (result.ok) {
      setStatus("saved");
      router.refresh();
      window.setTimeout(() => setStatus((s) => (s === "saved" ? "idle" : s)), 2000);
    } else {
      setAllowed(previous);
      setStatus("error");
    }
  }

  const switchId = `messaging-access-${patientId}`;

  return (
    <section className="p-4">
      <h3 className="text-[15px] font-semibold tracking-tight text-text-primary">Messaging</h3>

      <label
        htmlFor={switchId}
        className={cn(
          "mt-3 flex cursor-pointer items-center justify-between gap-3 rounded-[var(--radius-md)] border border-border p-3",
          "transition-all duration-200 ease-out hover:border-border-strong hover:bg-surface-muted hover:shadow-card",
        )}
      >
        <span className="min-w-0">
          <span className="block text-sm text-text-primary">Can contact the care team</span>
          <span className="mt-0.5 block text-xs text-text-secondary">
            {allowed
              ? `${patientFirstName} can message the hygienist from the patient portal.`
              : `${patientFirstName} can't send messages. Existing replies stay visible.`}
          </span>
        </span>

        {/* Same switch construction as the Settings notification rows: a real
            checkbox, visually hidden, with the track and knob drawn off
            `peer-checked`. `role="switch"` is what makes a screen reader say
            "on/off" rather than "checked". */}
        <span className="relative inline-flex h-6 w-11 shrink-0">
          <input
            id={switchId}
            type="checkbox"
            role="switch"
            aria-label={`Allow ${patientFirstName} to contact the care team`}
            checked={allowed}
            onChange={(e) => toggle(e.target.checked)}
            className="peer absolute inset-0 z-10 m-0 cursor-pointer opacity-0"
          />
          <span
            aria-hidden="true"
            className={cn(
              "pointer-events-none absolute inset-0 rounded-full bg-border-strong transition-colors duration-200 ease-out",
              "peer-checked:bg-[var(--color-brand-blue)]",
              "peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-[var(--color-brand-blue)]",
            )}
          />
          <span
            aria-hidden="true"
            className="pointer-events-none absolute left-0.5 top-1/2 h-5 w-5 -translate-y-1/2 rounded-full bg-white shadow-card transition-transform duration-200 ease-out peer-checked:translate-x-5 motion-reduce:transition-none"
          />
        </span>
      </label>

      <p
        aria-live="polite"
        className={cn("mt-2 text-xs", status === "error" ? "text-error-text" : "text-text-secondary")}
      >
        {status === "saving" && "Saving…"}
        {status === "saved" && "Saved."}
        {status === "error" && "Couldn't update messaging access. Please try again."}
        {status === "idle" && "Changes save automatically."}
      </p>
    </section>
  );
}
