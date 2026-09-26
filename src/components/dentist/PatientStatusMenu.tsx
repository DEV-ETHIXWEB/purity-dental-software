"use client";

import { useEffect, useId, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Loader2, MoreHorizontal } from "lucide-react";
import { cn } from "@/lib/cn";
import { setPatientStatus } from "@/lib/actions/set-patient-status";
import { PATIENT_STATUS_LABEL } from "@/components/dentist/PatientStatusBadge";
import type { PatientStatus } from "@/generated/prisma/client";

export interface PatientStatusMenuProps {
  patientId: string;
  /** Used for the trigger's accessible name — "Daniel Brooks" alone tells a screen reader nothing about what the button does. */
  patientName: string;
  status: PatientStatus;
}

/**
 * What each option means, in the words staff would use. "Remove" is the
 * verb on the archive action because that's what people call it; the copy
 * underneath is what stops it being mistaken for a delete.
 */
const OPTIONS: { value: PatientStatus; label: string; hint: string }[] = [
  { value: "ACTIVE", label: "Set active", hint: "Currently under treatment" },
  { value: "COMPLETED", label: "Mark completed", hint: "Course of treatment finished" },
  { value: "INACTIVE", label: "Remove", hint: "Archives the record — nothing is deleted" },
];

/**
 * Per-row status control for the patients list.
 *
 * Follows the same toggle / Escape / outside-pointer pattern as the top bar's
 * `ProfileMenu` and `NotificationsMenu`, so every popup in the app behaves
 * the same way.
 *
 * A menu rather than a `<select>`: the three choices need a line of
 * explanation each — above all "Remove", which archives and does not delete —
 * and an option element can't carry one.
 */
export function PatientStatusMenu({ patientId, patientName, status }: PatientStatusMenuProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuId = useId();

  useEffect(() => {
    if (!open) return;

    function handlePointerDown(event: PointerEvent) {
      if (!containerRef.current?.contains(event.target as Node)) setOpen(false);
    }
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.stopPropagation();
        setOpen(false);
        triggerRef.current?.focus();
      }
    }
    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  async function choose(next: PatientStatus) {
    if (busy) return;
    setBusy(true);
    setError(null);
    const result = await setPatientStatus({ patientId, status: next });
    setBusy(false);

    if (result.ok) {
      setOpen(false);
      router.refresh();
    } else {
      setError(result.error ?? "Couldn't update this patient.");
    }
  }

  return (
    <div ref={containerRef} className="relative">
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={`Change status for ${patientName} — currently ${PATIENT_STATUS_LABEL[status]}`}
        className={cn(
          "flex h-8 w-8 items-center justify-center rounded-[var(--radius-md)] text-text-secondary transition-colors duration-200 ease-out",
          // 44px touch floor on phones. This is a hand-rolled button, so it
          // does not inherit the floor in `Button`'s size classes — and a
          // mis-tap here changes a patient's status.
          "min-h-11 min-w-11 sm:min-h-0 sm:min-w-0",
          "hover:bg-surface-muted hover:text-text-primary",
          "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-brand-blue)]",
          open && "bg-surface-muted text-text-primary",
        )}
      >
        {busy ? (
          <Loader2 className="h-4 w-4 animate-spin motion-reduce:animate-none" aria-hidden="true" />
        ) : (
          <MoreHorizontal className="h-4 w-4" aria-hidden="true" />
        )}
      </button>

      {open && (
        <div
          id={menuId}
          role="menu"
          aria-label={`Status for ${patientName}`}
          className="animate-scale-in absolute right-0 top-full z-30 mt-1 w-60 origin-top-right overflow-hidden rounded-[var(--radius-lg)] border border-border bg-surface shadow-popover"
        >
          {OPTIONS.map((option) => {
            const isCurrent = option.value === status;
            return (
              <button
                key={option.value}
                type="button"
                role="menuitem"
                disabled={busy}
                onClick={() => choose(option.value)}
                className={cn(
                  "flex w-full items-start gap-2 px-3 py-2.5 text-left transition-colors duration-200 ease-out",
                  "hover:bg-surface-muted focus-visible:bg-surface-muted focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[var(--color-brand-blue)]",
                  isCurrent && "bg-surface-muted",
                )}
              >
                <Check
                  className={cn(
                    "mt-0.5 h-3.5 w-3.5 shrink-0",
                    isCurrent ? "text-[var(--color-brand-blue-text)]" : "text-transparent",
                  )}
                  aria-hidden="true"
                />
                <span className="min-w-0">
                  <span className="block text-sm font-medium text-text-primary">{option.label}</span>
                  <span className="block text-xs text-text-secondary">{option.hint}</span>
                </span>
              </button>
            );
          })}

          <p aria-live="polite" className={error ? "px-3 pb-2.5 text-xs text-error" : "sr-only"}>
            {error}
          </p>
        </div>
      )}
    </div>
  );
}
