"use client";

import { useState } from "react";
import { CheckCircle2, Loader2, UserRound } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/cn";
import { alternateProviders, currentProvider, type SampleProvider } from "@/lib/sample-data";

/**
 * "Switch dentist" UI affordance: lists alternate providers and lets the
 * patient request a switch. Purely a UI confirmation flow — no real
 * reassignment/backend logic happens.
 */
export function SwitchDentistModal() {
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<SampleProvider | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [requested, setRequested] = useState(false);

  function handleClose() {
    setOpen(false);
    // Reset after the close animation would run, so reopening starts fresh.
    window.setTimeout(() => {
      setSelected(null);
      setSubmitting(false);
      setRequested(false);
    }, 200);
  }

  function handleRequestSwitch() {
    if (!selected) return;
    setSubmitting(true);
    window.setTimeout(() => {
      setSubmitting(false);
      setRequested(true);
    }, 700);
  }

  return (
    <>
      <Button variant="outline" size="sm" className="min-h-11 self-start" onClick={() => setOpen(true)}>
        <UserRound className="h-4 w-4" aria-hidden="true" />
        Switch dentist
      </Button>

      <Modal
        open={open}
        onClose={handleClose}
        title="Switch your dentist"
        description={
          requested
            ? undefined
            : `You're currently seeing ${currentProvider.name}. Choose another provider to request a switch.`
        }
      >
        {requested ? (
          <div className="flex flex-col items-center gap-3 py-4 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-success-bg text-success">
              <CheckCircle2 className="h-6 w-6" aria-hidden="true" />
            </div>
            <div>
              <p className="text-sm font-semibold text-text-primary">Switch requested</p>
              <p className="mt-1 text-sm text-text-secondary">
                We&apos;ve let our front desk know you&apos;d like to switch to {selected?.name}. They&apos;ll follow up to confirm.
              </p>
            </div>
            <Button variant="outline" size="sm" onClick={handleClose} className="mt-1 min-h-11">
              Done
            </Button>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            <ul className="flex flex-col gap-2">
              {alternateProviders.map((provider) => (
                <li key={provider.id}>
                  <button
                    type="button"
                    onClick={() => setSelected(provider)}
                    aria-pressed={selected?.id === provider.id}
                    className={cn(
                      "flex min-h-11 w-full items-center justify-between rounded-[var(--radius-lg)] border px-4 py-3 text-left text-sm transition-colors",
                      "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-brand-blue)]",
                      selected?.id === provider.id
                        ? "border-[var(--color-brand-blue)] bg-info-bg"
                        : "border-border hover:bg-surface-muted",
                    )}
                  >
                    <span className="font-medium text-text-primary">{provider.name}</span>
                    <span className="text-text-secondary">{provider.role === "DENTIST" ? "Dentist" : "Hygienist"}</span>
                  </button>
                </li>
              ))}
            </ul>
            <Button
              onClick={handleRequestSwitch}
              disabled={!selected || submitting}
              className="min-h-11 self-start"
            >
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin motion-reduce:animate-none" aria-hidden="true" />
                  Sending request…
                </>
              ) : (
                "Request switch"
              )}
            </Button>
          </div>
        )}
      </Modal>
    </>
  );
}
