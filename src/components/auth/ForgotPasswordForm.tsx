"use client";

import { useId, useState, type FormEvent } from "react";
import Link from "next/link";
import { Loader2, CheckCircle2 } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { requestPasswordReset } from "@/lib/actions/password-reset";

export function ForgotPasswordForm() {
  const formId = useId();
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "submitting" | "done">("idle");
  const [message, setMessage] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus("submitting");
    const formData = new FormData();
    formData.set("email", email);
    const result = await requestPasswordReset(formData);
    setMessage(result.message);
    setStatus("done");
  }

  return (
    <Card className="p-2">
      <CardHeader className="flex-col items-start gap-1 pt-4">
        <CardTitle className="text-xl">Reset your password</CardTitle>
        <CardDescription>
          Enter your account email and we&apos;ll send a link to reset your password.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form noValidate onSubmit={handleSubmit} className="flex flex-col gap-5">
          <fieldset disabled={status === "submitting" || status === "done"} className="flex flex-col gap-4">
            <legend className="sr-only">Request password reset</legend>
            <Input
              id={`${formId}-email`}
              label="Email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
            />
          </fieldset>

          {message && (
            <p
              role="status"
              className="flex items-center gap-2 rounded-[var(--radius-md)] bg-surface-sunken px-3 py-2 text-sm font-medium text-text-primary"
            >
              {status === "done" && <CheckCircle2 className="h-4 w-4 shrink-0" aria-hidden="true" />}
              {message}
            </p>
          )}

          <div className="flex flex-col gap-3">
            <Button type="submit" disabled={status === "submitting" || status === "done"} className="justify-center">
              {status === "submitting" && <Loader2 className="h-4 w-4 animate-spin motion-reduce:animate-none" aria-hidden="true" />}
              {status === "submitting" ? "Sending…" : "Send reset link"}
            </Button>
            <Link
              href="/login"
              className="text-center text-sm font-medium text-text-secondary hover:text-text-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-brand-blue)] rounded-[var(--radius-sm)]"
            >
              Back to sign in
            </Link>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
