"use client";

import { useId, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Loader2, CheckCircle2 } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { resetPassword } from "@/lib/actions/password-reset";

interface FieldErrors {
  password?: string;
  confirmPassword?: string;
}

export function ResetPasswordForm({ token }: { token: string }) {
  const router = useRouter();
  const formId = useId();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [status, setStatus] = useState<"idle" | "submitting" | "success">("idle");

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setFormError(null);
    setFieldErrors({});

    if (!token) {
      setFormError("This reset link is missing its token. Please request a new one.");
      return;
    }

    setStatus("submitting");
    const formData = new FormData();
    formData.set("token", token);
    formData.set("password", password);
    formData.set("confirmPassword", confirmPassword);

    const result = await resetPassword(formData);

    if (result.status === "success") {
      setStatus("success");
      setTimeout(() => router.push("/login"), 1500);
      return;
    }

    setFormError(result.message);
    if (result.fieldErrors) {
      setFieldErrors(result.fieldErrors as FieldErrors);
    }
    setStatus("idle");
  }

  const isSubmitting = status === "submitting" || status === "success";

  return (
    <Card>
      <CardHeader className="flex-col items-start gap-1">
        <CardTitle>Set a new password</CardTitle>
        <CardDescription>Choose a new password for your account.</CardDescription>
      </CardHeader>
      <CardContent>
        <form noValidate onSubmit={handleSubmit} className="flex flex-col gap-5">
          <fieldset disabled={isSubmitting} className="flex flex-col gap-4">
            <legend className="sr-only">New password</legend>
            <div className="flex flex-col gap-1.5">
              <Input
                id={`${formId}-password`}
                label="New password"
                type="password"
                autoComplete="new-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                aria-invalid={!!fieldErrors.password}
                hint="At least 10 characters, with an uppercase letter, a lowercase letter, and a number."
              />
              {fieldErrors.password && (
                <p role="alert" className="text-xs font-medium text-error-text">
                  {fieldErrors.password}
                </p>
              )}
            </div>
            <div className="flex flex-col gap-1.5">
              <Input
                id={`${formId}-confirmPassword`}
                label="Confirm new password"
                type="password"
                autoComplete="new-password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                aria-invalid={!!fieldErrors.confirmPassword}
              />
              {fieldErrors.confirmPassword && (
                <p role="alert" className="text-xs font-medium text-error-text">
                  {fieldErrors.confirmPassword}
                </p>
              )}
            </div>
          </fieldset>

          {formError && (
            <p role="alert" className="rounded-[var(--radius-md)] bg-error-bg px-3 py-2 text-sm font-medium text-error-text">
              {formError}
            </p>
          )}
          {status === "success" && (
            <p role="status" className="flex items-center gap-2 rounded-[var(--radius-md)] bg-surface-sunken px-3 py-2 text-sm font-medium text-text-primary">
              <CheckCircle2 className="h-4 w-4 shrink-0" aria-hidden="true" />
              Password reset. Redirecting to sign in…
            </p>
          )}

          <div className="flex flex-col gap-3">
            <Button type="submit" disabled={isSubmitting} className="justify-center">
              {status === "submitting" && <Loader2 className="h-4 w-4 animate-spin motion-reduce:animate-none" aria-hidden="true" />}
              {status === "submitting" ? "Resetting…" : "Reset password"}
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
