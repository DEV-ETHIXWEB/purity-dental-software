"use client";

import { useId, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { login } from "@/lib/actions/login";

interface FieldErrors {
  email?: string;
  password?: string;
}

/**
 * Login form. Client-side "required" attributes give immediate UX feedback,
 * but the actual validation boundary is the Zod schema inside the `login`
 * Server Action — this component just renders whatever that action
 * returns. Wrong-credentials, rate-limiting, and "service unavailable"
 * (no live DB yet) all render as a single generic banner so nothing here
 * leaks account existence or DB internals.
 */
export function LoginForm() {
  const router = useRouter();
  const formId = useId();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [status, setStatus] = useState<"idle" | "submitting">("idle");

  function validateClientSide(): boolean {
    const errors: FieldErrors = {};
    if (!email.trim()) errors.email = "Email is required.";
    if (!password) errors.password = "Password is required.";
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setFormError(null);

    if (!validateClientSide()) return;

    setStatus("submitting");
    try {
      const formData = new FormData();
      formData.set("email", email);
      formData.set("password", password);

      const result = await login(formData);

      if (result.status === "success") {
        router.push(result.redirectTo);
        router.refresh();
        return;
      }

      setFormError(result.message);
      setStatus("idle");
    } catch {
      setFormError("Something went wrong. Please try again.");
      setStatus("idle");
    }
  }

  const isSubmitting = status === "submitting";

  return (
    <Card>
      <CardHeader className="flex-col items-start gap-1">
        <CardTitle>Sign in to Purity</CardTitle>
        <CardDescription>Enter your email and password to access your portal.</CardDescription>
      </CardHeader>
      <CardContent>
        <form noValidate onSubmit={handleSubmit} className="flex flex-col gap-5">
          <fieldset className="flex flex-col gap-4" disabled={isSubmitting}>
            <legend className="sr-only">Sign in</legend>
            <div className="flex flex-col gap-1.5">
              <Input
                id={`${formId}-email`}
                label="Email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (fieldErrors.email) setFieldErrors((prev) => ({ ...prev, email: undefined }));
                }}
                aria-invalid={!!fieldErrors.email}
                aria-describedby={fieldErrors.email ? `${formId}-email-error` : undefined}
                placeholder="you@example.com"
              />
              {fieldErrors.email && (
                <p id={`${formId}-email-error`} role="alert" className="text-xs font-medium text-error-text">
                  {fieldErrors.email}
                </p>
              )}
            </div>

            <div className="flex flex-col gap-1.5">
              <Input
                id={`${formId}-password`}
                label="Password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (fieldErrors.password) setFieldErrors((prev) => ({ ...prev, password: undefined }));
                }}
                aria-invalid={!!fieldErrors.password}
                aria-describedby={fieldErrors.password ? `${formId}-password-error` : undefined}
              />
              {fieldErrors.password && (
                <p id={`${formId}-password-error`} role="alert" className="text-xs font-medium text-error-text">
                  {fieldErrors.password}
                </p>
              )}
            </div>
          </fieldset>

          {formError && (
            <p role="alert" className="rounded-[var(--radius-md)] bg-error-bg px-3 py-2 text-sm font-medium text-error-text">
              {formError}
            </p>
          )}

          <div className="flex flex-col gap-3">
            <Button type="submit" disabled={isSubmitting} className="justify-center">
              {isSubmitting && <Loader2 className="h-4 w-4 animate-spin motion-reduce:animate-none" aria-hidden="true" />}
              {isSubmitting ? "Signing in…" : "Sign in"}
            </Button>
            <Link
              href="/forgot-password"
              className="text-center text-sm font-medium text-text-secondary hover:text-text-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-brand-blue)] rounded-[var(--radius-sm)]"
            >
              Forgot your password?
            </Link>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
