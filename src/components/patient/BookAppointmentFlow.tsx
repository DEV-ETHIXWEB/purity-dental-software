"use client";

import { useId, useState } from "react";
import { CalendarCheck, CheckCircle2, ChevronLeft, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/cn";
import { bookingReasons, openAppointmentSlots, type SampleOpenSlot } from "@/lib/sample-data";
import { formatFriendlyDate, formatTime } from "./formatters";

type Step = "select" | "confirm" | "success";

/**
 * Multi-step "request an appointment" flow: pick a reason and an open slot,
 * review before confirming, then a success state. This is a UI-only demo —
 * "booking" just moves through local component state, there's no real
 * scheduling backend or availability engine behind `openAppointmentSlots`.
 */
export function BookAppointmentFlow({ onBooked }: { onBooked?: (slot: SampleOpenSlot, reason: string) => void }) {
  const [step, setStep] = useState<Step>("select");
  const [reason, setReason] = useState<string>(bookingReasons[0]);
  const [selectedSlotId, setSelectedSlotId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const reasonLabelId = useId();

  const selectedSlot = openAppointmentSlots.find((s) => s.id === selectedSlotId) ?? null;

  function handleConfirm() {
    if (!selectedSlot) return;
    setSubmitting(true);
    // Simulated network delay so the confirm button shows a real loading
    // state rather than an instant, jarring jump to success.
    window.setTimeout(() => {
      setSubmitting(false);
      setStep("success");
      onBooked?.(selectedSlot, reason);
    }, 700);
  }

  function handleStartOver() {
    setStep("select");
    setSelectedSlotId(null);
    setReason(bookingReasons[0]);
  }

  if (step === "success" && selectedSlot) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center gap-3 py-10 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-success-bg text-success">
            <CheckCircle2 className="h-8 w-8" aria-hidden="true" />
          </div>
          <div>
            <p className="text-lg font-semibold text-text-primary">Appointment requested</p>
            <p className="mt-1 text-sm text-text-secondary">
              We&apos;ve got your {reason.toLowerCase()} request for {formatFriendlyDate(selectedSlot.startTime)} at{" "}
              {formatTime(selectedSlot.startTime)}. You&apos;ll see it in your upcoming visits below.
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={handleStartOver} className="mt-2">
            Book another visit
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{step === "select" ? "Book a visit" : "Review your request"}</CardTitle>
        <CardDescription>
          {step === "select"
            ? "Pick a reason and a time that works for you."
            : "Double check the details, then confirm."}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-5">
        {step === "select" && (
          <>
            <fieldset className="flex flex-col gap-2">
              <legend id={reasonLabelId} className="text-sm font-medium text-text-primary">
                What&apos;s this visit for?
              </legend>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2" role="radiogroup" aria-labelledby={reasonLabelId}>
                {bookingReasons.map((r) => (
                  <label
                    key={r}
                    className={cn(
                      "flex min-h-11 cursor-pointer items-center gap-2 rounded-[var(--radius-lg)] border px-4 py-2.5 text-sm font-medium transition-colors",
                      reason === r
                        ? "border-[var(--color-brand-blue)] bg-info-bg text-[var(--color-brand-blue-text)]"
                        : "border-border text-text-primary hover:bg-surface-muted",
                    )}
                  >
                    <input
                      type="radio"
                      name="booking-reason"
                      value={r}
                      checked={reason === r}
                      onChange={() => setReason(r)}
                      className="h-4 w-4 text-[var(--color-brand-blue)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-brand-blue)]"
                    />
                    {r}
                  </label>
                ))}
              </div>
            </fieldset>

            <div className="flex flex-col gap-2">
              <p className="text-sm font-medium text-text-primary">Choose an open time</p>
              <ul className="flex flex-col gap-2">
                {openAppointmentSlots.map((slot) => (
                  <li key={slot.id}>
                    <button
                      type="button"
                      onClick={() => setSelectedSlotId(slot.id)}
                      aria-pressed={selectedSlotId === slot.id}
                      className={cn(
                        "flex min-h-11 w-full items-center justify-between rounded-[var(--radius-lg)] border px-4 py-2.5 text-left text-sm transition-colors",
                        "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-brand-blue)]",
                        selectedSlotId === slot.id
                          ? "border-[var(--color-brand-blue)] bg-info-bg"
                          : "border-border hover:bg-surface-muted",
                      )}
                    >
                      <span className="font-medium text-text-primary">
                        {formatFriendlyDate(slot.startTime)}
                      </span>
                      <span className="text-text-secondary">{formatTime(slot.startTime)} · {slot.providerName}</span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>

            <Button
              onClick={() => setStep("confirm")}
              disabled={!selectedSlotId}
              className="min-h-11 self-start"
            >
              <CalendarCheck className="h-4 w-4" aria-hidden="true" />
              Continue
            </Button>
          </>
        )}

        {step === "confirm" && selectedSlot && (
          <>
            <dl className="flex flex-col gap-3 rounded-[var(--radius-lg)] border border-border bg-surface-muted p-4 text-sm">
              <div className="flex justify-between gap-3">
                <dt className="text-text-secondary">Reason</dt>
                <dd className="font-medium text-text-primary">{reason}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-text-secondary">Date</dt>
                <dd className="font-medium text-text-primary">{formatFriendlyDate(selectedSlot.startTime)}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-text-secondary">Time</dt>
                <dd className="font-medium text-text-primary">{formatTime(selectedSlot.startTime)}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-text-secondary">With</dt>
                <dd className="font-medium text-text-primary">{selectedSlot.providerName}</dd>
              </div>
            </dl>
            <div className="flex flex-wrap items-center gap-3">
              <Button variant="ghost" onClick={() => setStep("select")} className="min-h-11">
                <ChevronLeft className="h-4 w-4" aria-hidden="true" />
                Back
              </Button>
              <Button onClick={handleConfirm} disabled={submitting} className="min-h-11">
                {submitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin motion-reduce:animate-none" aria-hidden="true" />
                    Confirming…
                  </>
                ) : (
                  "Confirm appointment"
                )}
              </Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
