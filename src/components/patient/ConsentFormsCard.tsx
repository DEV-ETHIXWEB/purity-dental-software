"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { EmptyState } from "@/components/patient/EmptyState";
import { SignatureIconFilled } from "@/components/ui/icons/purity-icons";
import { cn } from "@/lib/cn";
import { signConsentForm } from "@/lib/actions/clinical-records";
import type { ConsentForm } from "@/generated/prisma/client";

export interface ConsentFormsCardProps {
  forms: ConsentForm[];
}

const STAGGER = ["stagger-0", "stagger-1", "stagger-2", "stagger-3", "stagger-4", "stagger-5"];

/**
 * Forms the practice has asked this patient to sign. Signing is a typed-name
 * agreement recorded with a timestamp — the copy says exactly that rather
 * than implying a legally binding e-signature the app doesn't provide.
 */
export function ConsentFormsCard({ forms }: ConsentFormsCardProps) {
  const router = useRouter();
  const [openForm, setOpenForm] = useState<ConsentForm | null>(null);
  const [signature, setSignature] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function close() {
    setOpenForm(null);
    setSignature("");
    setError(null);
  }

  async function handleSign() {
    if (!openForm || busy) return;
    setBusy(true);
    setError(null);
    const result = await signConsentForm(openForm.id, signature);
    setBusy(false);
    if (result.ok) {
      close();
      router.refresh();
    } else {
      setError(result.error ?? "Couldn't record your signature.");
    }
  }

  if (forms.length === 0) {
    return (
      <EmptyState
        icon={SignatureIconFilled}
        title="Nothing to sign right now"
        description="Any forms that need your signature will show up here."
      />
    );
  }

  return (
    <>
      <ul className="flex flex-col gap-2">
        {forms.map((form, i) => {
          const signed = form.status === "SIGNED";
          return (
            <li
              key={form.id}
              className={cn(
                "animate-rise-in flex flex-wrap items-center gap-x-3 gap-y-2 rounded-[var(--radius-lg)] border border-border bg-surface p-3",
                "transition-all duration-200 ease-out hover:-translate-y-0.5 hover:border-border-strong hover:shadow-card motion-reduce:hover:translate-y-0",
                STAGGER[i] ?? "stagger-5",
              )}
            >
              <span
                className={cn(
                  "flex h-9 w-9 shrink-0 items-center justify-center rounded-full",
                  signed ? "bg-success-bg text-success-text" : "bg-warning-bg text-warning-text",
                )}
              >
                {signed ? (
                  <Check className="h-4 w-4" aria-hidden="true" />
                ) : (
                  <SignatureIconFilled className="h-4 w-4" aria-hidden="true" />
                )}
              </span>
              <div className="min-w-0 flex-1 basis-40">
                <p className="truncate text-sm font-medium text-text-primary">{form.title}</p>
                <p className="truncate text-xs text-text-secondary">
                  {signed && form.signedAt
                    ? `Signed ${form.signedAt.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`
                    : "Needs your signature"}
                </p>
              </div>
              {signed ? (
                <Badge tone="success" className="shrink-0">
                  Signed
                </Badge>
              ) : (
                <Button
                  size="sm"
                  onClick={() => setOpenForm(form)}
                  className="min-h-11 shrink-0 transition-all duration-200 ease-out hover:shadow-card-hover active:scale-[0.98] motion-reduce:active:scale-100"
                >
                  Review &amp; sign
                </Button>
              )}
            </li>
          );
        })}
      </ul>

      <Modal
        open={openForm !== null}
        onClose={close}
        title={openForm?.title ?? "Consent form"}
      >
        <div className="flex flex-col gap-4">
          <p className="max-h-56 overflow-y-auto whitespace-pre-line rounded-[var(--radius-md)] bg-surface-muted p-3 text-sm leading-relaxed text-text-primary">
            {openForm?.body}
          </p>

          <Input
            label="Type your full name to sign"
            value={signature}
            onChange={(e) => setSignature(e.target.value)}
            placeholder="Your full name"
            autoComplete="name"
            className="transition-colors duration-200 ease-out hover:border-border-strong focus:border-[var(--color-brand-blue)]"
            hint="Your name and the date are recorded as your agreement."
          />

          {error && (
            <p role="alert" className="animate-rise-in text-sm text-error">
              {error}
            </p>
          )}

          <div className="flex flex-wrap gap-2">
            <Button
              onClick={handleSign}
              disabled={busy || signature.trim().length < 2}
              className="min-h-11 transition-all duration-200 ease-out hover:shadow-card-hover active:scale-[0.98] motion-reduce:active:scale-100"
            >
              {busy && <Loader2 className="h-4 w-4 animate-spin motion-reduce:animate-none" aria-hidden="true" />}
              {busy ? "Signing…" : "Agree and sign"}
            </Button>
            <Button variant="outline" onClick={close} className="min-h-11">
              Cancel
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}
