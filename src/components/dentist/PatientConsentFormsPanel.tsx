"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Plus, Signature, X } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { cn } from "@/lib/cn";
import { issueConsentForm } from "@/lib/actions/clinical-records";
import type { ConsentForm } from "@/generated/prisma/client";

export interface PatientConsentFormsPanelProps {
  patientId: string;
  forms: ConsentForm[];
  canManage?: boolean;
}

const STAGGER = ["stagger-0", "stagger-1", "stagger-2", "stagger-3", "stagger-4", "stagger-5"];

const TEXTAREA_CLASSES =
  "min-h-24 w-full rounded-[var(--radius-md)] border border-border bg-surface p-3 text-sm text-text-primary placeholder:text-text-secondary transition-colors duration-200 ease-out hover:border-border-strong focus:border-[var(--color-brand-blue)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-brand-blue)]";

/**
 * Consent forms issued to a patient. Staff write them here; the patient signs
 * from their own portal — this panel never signs on their behalf, it only
 * shows whether they have.
 */
export function PatientConsentFormsPanel({ patientId, forms, canManage = true }: PatientConsentFormsPanelProps) {
  const router = useRouter();
  const [adding, setAdding] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");

  async function handleIssue(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    setBusy(true);
    setError(null);
    const result = await issueConsentForm({ patientId, title, body });
    setBusy(false);
    if (result.ok) {
      setTitle("");
      setBody("");
      setAdding(false);
      router.refresh();
    } else {
      setError(result.error ?? "Couldn't issue that form.");
    }
  }

  const pending = forms.filter((f) => f.status === "PENDING").length;

  return (
    <section className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-[15px] font-semibold tracking-tight text-text-primary">
          Consent forms
          {pending > 0 && (
            <span className="ml-2 text-sm font-normal text-warning-text">{pending} awaiting signature</span>
          )}
        </h3>
        {canManage && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setAdding((v) => !v);
              setError(null);
            }}
            aria-expanded={adding}
            className="min-h-11 transition-all duration-200 ease-out hover:shadow-card active:scale-[0.98] motion-reduce:active:scale-100"
          >
            {adding ? <X className="h-4 w-4" aria-hidden="true" /> : <Plus className="h-4 w-4" aria-hidden="true" />}
            {adding ? "Cancel" : "Issue form"}
          </Button>
        )}
      </div>

      {adding && canManage && (
        <form
          onSubmit={handleIssue}
          className="animate-scale-in flex flex-col gap-3 rounded-[var(--radius-lg)] border border-border bg-surface-muted/50 p-4"
        >
          <Input
            label="Form title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Consent for scaling and root planing"
            required
            className="transition-colors duration-200 ease-out hover:border-border-strong focus:border-[var(--color-brand-blue)]"
          />
          <div className="flex flex-col gap-1.5">
            <label htmlFor={`consent-body-${patientId}`} className="text-sm font-medium text-text-primary">
              What the patient is agreeing to
            </label>
            <textarea
              id={`consent-body-${patientId}`}
              value={body}
              onChange={(e) => setBody(e.target.value)}
              required
              placeholder="Describe the procedure, risks and aftercare in plain language…"
              className={TEXTAREA_CLASSES}
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
            {busy ? "Issuing…" : "Send to patient"}
          </Button>
        </form>
      )}

      {forms.length === 0 ? (
        <p className="rounded-[var(--radius-lg)] border border-dashed border-border py-8 text-center text-sm text-text-secondary">
          No consent forms issued yet.
        </p>
      ) : (
        <ul className="flex flex-col gap-2">
          {forms.map((form, i) => (
            <li
              key={form.id}
              className={cn(
                "animate-rise-in flex flex-wrap items-center gap-x-3 gap-y-2 rounded-[var(--radius-md)] border border-border bg-surface p-3",
                "transition-all duration-200 ease-out hover:-translate-y-0.5 hover:border-border-strong hover:shadow-card motion-reduce:hover:translate-y-0",
                STAGGER[i] ?? "stagger-5",
              )}
            >
              <span
                className={cn(
                  "flex h-9 w-9 shrink-0 items-center justify-center rounded-full",
                  form.status === "SIGNED"
                    ? "bg-success-bg text-success-text"
                    : "bg-warning-bg text-warning-text",
                )}
              >
                <Signature className="h-4 w-4" aria-hidden="true" />
              </span>
              <div className="min-w-0 flex-1 basis-44">
                <p className="truncate text-sm font-medium text-text-primary">{form.title}</p>
                <p className="truncate text-xs text-text-secondary">
                  {form.status === "SIGNED" && form.signedAt
                    ? `Signed by ${form.signatureName} · ${form.signedAt.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`
                    : `Issued ${form.createdAt.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`}
                </p>
              </div>
              <Badge tone={form.status === "SIGNED" ? "success" : "warning"} className="shrink-0">
                {form.status === "SIGNED" ? "Signed" : "Awaiting signature"}
              </Badge>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
