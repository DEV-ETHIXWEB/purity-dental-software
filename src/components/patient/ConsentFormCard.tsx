"use client";

import { useId, useState } from "react";
import { CheckCircle2, FileText, Loader2 } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import type { SampleConsentForm } from "@/lib/sample-data";

/**
 * Real-feeling e-sign interaction for one consent form: must check "I have
 * reviewed and agree" before Sign enables, then shows a signed/completed
 * state with a timestamp. Client-side state only — no real document
 * rendering or e-signature provider behind this.
 */
export function ConsentFormCard({ form }: { form: SampleConsentForm }) {
  const [agreed, setAgreed] = useState(false);
  const [signing, setSigning] = useState(false);
  const [signedAt, setSignedAt] = useState<string | null>(null);
  const checkboxId = useId();

  function handleSign() {
    setSigning(true);
    window.setTimeout(() => {
      setSigning(false);
      setSignedAt(new Date().toISOString());
    }, 700);
  }

  const isSigned = signedAt !== null;

  return (
    <Card className="flex flex-col gap-4 p-5">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-surface-sunken text-[var(--color-brand-blue-text)]">
          <FileText className="h-5 w-5" aria-hidden="true" />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-text-primary">{form.title}</p>
          <p className="text-sm text-text-secondary">{form.description}</p>
        </div>
      </div>

      {isSigned ? (
        <div className="flex items-center gap-2 rounded-[var(--radius-lg)] bg-success-bg px-4 py-3 text-sm text-success-text">
          <CheckCircle2 className="h-4 w-4 shrink-0" aria-hidden="true" />
          <span>
            Signed on{" "}
            {new Date(signedAt).toLocaleString("en-US", {
              month: "short",
              day: "numeric",
              hour: "numeric",
              minute: "2-digit",
            })}
          </span>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          <label htmlFor={checkboxId} className="flex min-h-11 cursor-pointer items-start gap-3 text-sm">
            <input
              id={checkboxId}
              type="checkbox"
              checked={agreed}
              onChange={(e) => setAgreed(e.target.checked)}
              className="mt-0.5 h-5 w-5 shrink-0 rounded border-border-strong text-[var(--color-brand-blue)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-brand-blue)]"
            />
            <span className="text-text-primary">I have reviewed and agree to this document.</span>
          </label>
          <Button
            onClick={handleSign}
            disabled={!agreed || signing}
            size="sm"
            className="min-h-11 self-start"
          >
            {signing ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin motion-reduce:animate-none" aria-hidden="true" />
                Signing…
              </>
            ) : (
              "Sign"
            )}
          </Button>
        </div>
      )}
    </Card>
  );
}
