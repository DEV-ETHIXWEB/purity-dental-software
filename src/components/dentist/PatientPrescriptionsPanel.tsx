"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Loader2, Pill, Plus, X } from "lucide-react";
import { Badge, type BadgeTone } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { cn } from "@/lib/cn";
import { addPrescription, setPrescriptionStatus } from "@/lib/actions/clinical-records";
import type { PrescriptionWithPrescriber } from "@/lib/data/clinical-records";
import type { PrescriptionStatus } from "@/generated/prisma/client";

export interface PatientPrescriptionsPanelProps {
  patientId: string;
  prescriptions: PrescriptionWithPrescriber[];
  canManage?: boolean;
}

const STATUS_TONE: Record<PrescriptionStatus, BadgeTone> = {
  ACTIVE: "success",
  COMPLETED: "neutral",
  CANCELLED: "neutral",
};

const STATUS_LABEL: Record<PrescriptionStatus, string> = {
  ACTIVE: "Active",
  COMPLETED: "Completed",
  CANCELLED: "Cancelled",
};

const STAGGER = ["stagger-0", "stagger-1", "stagger-2", "stagger-3", "stagger-4", "stagger-5"];

const FIELD_CLASSES =
  "transition-colors duration-200 ease-out hover:border-border-strong focus:border-[var(--color-brand-blue)]";

/** Medications and products prescribed to a patient — the "meds, products" arm of the record. */
export function PatientPrescriptionsPanel({
  patientId,
  prescriptions,
  canManage = true,
}: PatientPrescriptionsPanelProps) {
  const router = useRouter();
  const [adding, setAdding] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const [medication, setMedication] = useState("");
  const [dosage, setDosage] = useState("");
  const [quantity, setQuantity] = useState("");
  const [instructions, setInstructions] = useState("");

  function resetForm() {
    setMedication("");
    setDosage("");
    setQuantity("");
    setInstructions("");
    setError(null);
  }

  async function handleAdd(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    setBusy(true);
    setError(null);
    const result = await addPrescription({ patientId, medication, dosage, quantity, instructions });
    setBusy(false);
    if (result.ok) {
      resetForm();
      setAdding(false);
      router.refresh();
    } else {
      setError(result.error ?? "Couldn't save that prescription.");
    }
  }

  async function handleStatus(id: string, status: PrescriptionStatus) {
    setUpdatingId(id);
    setError(null);
    const result = await setPrescriptionStatus(id, status);
    setUpdatingId(null);
    if (result.ok) router.refresh();
    else setError(result.error ?? "Couldn't update that prescription.");
  }

  return (
    <section className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-[15px] font-semibold tracking-tight text-text-primary">
          Prescriptions
          <span className="ml-2 text-sm font-normal text-text-secondary">Meds and products</span>
        </h3>
        {canManage && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setAdding((v) => !v);
              resetForm();
            }}
            aria-expanded={adding}
            className="min-h-11 transition-all duration-200 ease-out hover:shadow-card active:scale-[0.98] motion-reduce:active:scale-100"
          >
            {adding ? <X className="h-4 w-4" aria-hidden="true" /> : <Plus className="h-4 w-4" aria-hidden="true" />}
            {adding ? "Cancel" : "Add prescription"}
          </Button>
        )}
      </div>

      {adding && canManage && (
        <form
          onSubmit={handleAdd}
          className="animate-scale-in flex flex-col gap-3 rounded-[var(--radius-lg)] border border-border bg-surface-muted/50 p-4"
        >
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <Input
              label="Medication or product"
              value={medication}
              onChange={(e) => setMedication(e.target.value)}
              placeholder="Amoxicillin"
              required
              className={FIELD_CLASSES}
              wrapperClassName="sm:col-span-2"
            />
            <Input
              label="Dosage"
              value={dosage}
              onChange={(e) => setDosage(e.target.value)}
              placeholder="500mg"
              required
              className={FIELD_CLASSES}
            />
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <Input
              label="Quantity"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              placeholder="21 capsules"
              className={FIELD_CLASSES}
            />
            <Input
              label="Instructions"
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              placeholder="One three times daily, with food"
              className={FIELD_CLASSES}
              wrapperClassName="sm:col-span-2"
            />
          </div>
          {error && (
            <p role="alert" className="animate-rise-in text-sm text-error">
              {error}
            </p>
          )}
          <Button
            type="submit"
            disabled={busy}
            className="min-h-11 self-start transition-all duration-200 ease-out hover:shadow-card-hover active:scale-[0.98] motion-reduce:active:scale-100"
          >
            {busy && <Loader2 className="h-4 w-4 animate-spin motion-reduce:animate-none" aria-hidden="true" />}
            {busy ? "Saving…" : "Save prescription"}
          </Button>
        </form>
      )}

      {prescriptions.length === 0 ? (
        <p className="rounded-[var(--radius-lg)] border border-dashed border-border py-8 text-center text-sm text-text-secondary">
          No prescriptions on file yet.
        </p>
      ) : (
        <ul className="flex flex-col gap-2">
          {prescriptions.map((rx, i) => (
            <li
              key={rx.id}
              className={cn(
                "group/rx animate-rise-in flex flex-wrap items-center gap-x-3 gap-y-2 rounded-[var(--radius-md)] border border-border bg-surface p-3",
                "transition-all duration-200 ease-out hover:-translate-y-0.5 hover:border-border-strong hover:shadow-card motion-reduce:hover:translate-y-0",
                rx.status !== "ACTIVE" && "opacity-70",
                STAGGER[i] ?? "stagger-5",
              )}
            >
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-info-bg text-[var(--color-brand-blue-text)]">
                <Pill className="h-4 w-4" aria-hidden="true" />
              </span>
              <div className="min-w-0 flex-1 basis-44">
                <p className="truncate text-sm font-medium text-text-primary">
                  {rx.medication} <span className="text-text-secondary">· {rx.dosage}</span>
                </p>
                <p className="truncate text-xs text-text-secondary">
                  {[rx.quantity, rx.instructions].filter(Boolean).join(" · ") || "No further instructions"}
                </p>
                <p className="truncate text-xs text-text-secondary">
                  {rx.prescriber?.name ? `${rx.prescriber.name} · ` : ""}
                  {rx.prescribedAt.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                </p>
              </div>
              <Badge tone={STATUS_TONE[rx.status]} className="shrink-0">
                {STATUS_LABEL[rx.status]}
              </Badge>
              {canManage && rx.status === "ACTIVE" && (
                <div className="flex shrink-0 gap-1">
                  <button
                    type="button"
                    onClick={() => handleStatus(rx.id, "COMPLETED")}
                    disabled={updatingId === rx.id}
                    aria-label={`Mark ${rx.medication} completed`}
                    className="rounded-[var(--radius-md)] p-2 text-text-secondary transition-colors duration-200 ease-out hover:bg-success-bg hover:text-success-text focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-brand-blue)] disabled:opacity-50"
                  >
                    {updatingId === rx.id ? (
                      <Loader2 className="h-4 w-4 animate-spin motion-reduce:animate-none" aria-hidden="true" />
                    ) : (
                      <Check className="h-4 w-4" aria-hidden="true" />
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleStatus(rx.id, "CANCELLED")}
                    disabled={updatingId === rx.id}
                    aria-label={`Cancel ${rx.medication}`}
                    className="rounded-[var(--radius-md)] p-2 text-text-secondary transition-colors duration-200 ease-out hover:bg-error-bg hover:text-error-text focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-brand-blue)] disabled:opacity-50"
                  >
                    <X className="h-4 w-4" aria-hidden="true" />
                  </button>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}

      {error && !adding && (
        <p role="alert" className="animate-rise-in text-sm text-error">
          {error}
        </p>
      )}
    </section>
  );
}
