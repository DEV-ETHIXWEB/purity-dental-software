"use client";

import { useId, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowRight, Check, Eye, EyeOff, Loader2, Mail } from "lucide-react";
import { cn } from "@/lib/cn";
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
 *
 * The fields are built here rather than on `ui/Input` + `ui/PasswordInput`:
 * this screen's comps put an affordance icon inside a taller field and give
 * it its own focus ring (`.auth-input`), which those primitives don't
 * decompose far enough to express. Label/description wiring matches them.
 */
export function LoginForm() {
  const router = useRouter();
  const formId = useId();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(true);
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
      // Drives session lifetime, not just a prefill — see `createSession`.
      if (remember) formData.set("remember", "on");

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
    <div className="flex flex-col">
      <p className="animate-rise-in stagger-0 hidden text-[2.6rem] font-bold leading-none tracking-tight brand-gradient-text lg:block">
        Purity
      </p>

      <h1 className="animate-rise-in stagger-1 mt-0 text-[2rem] font-bold leading-tight tracking-tight text-text-primary lg:mt-7">
        Welcome back
      </h1>
      <p className="animate-rise-in stagger-2 mt-1.5 text-[0.95rem] text-text-secondary">
        Sign in to continue to your practice.
      </p>

      <form noValidate onSubmit={handleSubmit} className="mt-7 flex flex-col gap-5">
        <fieldset className="flex flex-col gap-4" disabled={isSubmitting}>
          <legend className="sr-only">Sign in</legend>

          <div className="animate-rise-in stagger-3 flex flex-col gap-1.5">
            <label htmlFor={`${formId}-email`} className="text-sm font-semibold text-text-primary">
              Email
            </label>
            <div className="auth-field relative">
              <input
                id={`${formId}-email`}
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
                placeholder="you@puritydental.com"
                className={cn(
                  "auth-input h-12 w-full rounded-[var(--radius-lg)] border border-border bg-surface pl-4 pr-11 text-[0.95rem] text-text-primary placeholder:text-text-secondary/70",
                  "disabled:pointer-events-none disabled:opacity-50",
                  fieldErrors.email && "border-error",
                )}
              />
              <Mail
                className="auth-field-icon pointer-events-none absolute right-3.5 top-1/2 h-[1.15rem] w-[1.15rem] -translate-y-1/2 text-text-secondary"
                aria-hidden="true"
              />
            </div>
            {fieldErrors.email && (
              <p id={`${formId}-email-error`} role="alert" className="animate-fade-in text-xs font-medium text-error-text">
                {fieldErrors.email}
              </p>
            )}
          </div>

          <div className="animate-rise-in stagger-4 flex flex-col gap-1.5">
            <label htmlFor={`${formId}-password`} className="text-sm font-semibold text-text-primary">
              Password
            </label>
            <div className="auth-field relative">
              <input
                id={`${formId}-password`}
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (fieldErrors.password) setFieldErrors((prev) => ({ ...prev, password: undefined }));
                }}
                aria-invalid={!!fieldErrors.password}
                aria-describedby={fieldErrors.password ? `${formId}-password-error` : undefined}
                placeholder="••••••••"
                className={cn(
                  "auth-input h-12 w-full rounded-[var(--radius-lg)] border border-border bg-surface pl-4 pr-11 text-[0.95rem] text-text-primary placeholder:text-text-secondary/70",
                  "disabled:pointer-events-none disabled:opacity-50",
                  fieldErrors.password && "border-error",
                )}
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? "Hide password" : "Show password"}
                aria-pressed={showPassword}
                className="auth-field-icon absolute right-1.5 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-[var(--radius-md)] text-text-secondary hover:text-text-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-brand-blue)] disabled:pointer-events-none disabled:opacity-50"
              >
                {showPassword ? (
                  <EyeOff className="h-[1.15rem] w-[1.15rem]" aria-hidden="true" />
                ) : (
                  <Eye className="h-[1.15rem] w-[1.15rem]" aria-hidden="true" />
                )}
              </button>
            </div>
            {fieldErrors.password && (
              <p id={`${formId}-password-error`} role="alert" className="animate-fade-in text-xs font-medium text-error-text">
                {fieldErrors.password}
              </p>
            )}
          </div>

          <div className="animate-rise-in stagger-5 flex flex-wrap items-center justify-between gap-3">
            <button
              type="button"
              role="checkbox"
              aria-checked={remember}
              onClick={() => setRemember((v) => !v)}
              className="auth-check-btn group flex items-center gap-2.5 rounded-[var(--radius-sm)] text-sm text-text-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-brand-blue)] disabled:pointer-events-none disabled:opacity-50"
            >
              <span
                aria-hidden="true"
                className={cn(
                  "auth-check flex h-[1.15rem] w-[1.15rem] items-center justify-center rounded-[var(--radius-sm)] border",
                  remember ? "auth-check-on" : "border-border-strong bg-surface group-hover:border-[var(--color-brand-blue)]",
                )}
              >
                {remember && <Check className="animate-pop-in h-3.5 w-3.5 text-white" strokeWidth={3} />}
              </span>
              Remember me
            </button>

            <Link
              href="/forgot-password"
              className="rounded-[var(--radius-sm)] text-sm font-medium text-brand-blue-text underline-offset-4 transition-colors hover:text-[var(--color-brand-blue)] hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-brand-blue)]"
            >
              Forgot your password?
            </Link>
          </div>
        </fieldset>

        {formError && (
          <p
            role="alert"
            className="animate-rise-in rounded-[var(--radius-md)] bg-error-bg px-3 py-2.5 text-sm font-medium text-error-text"
          >
            {formError}
          </p>
        )}

        <button
          type="submit"
          disabled={isSubmitting}
          className={cn(
            "animate-rise-in stagger-6 cta-gradient-slide auth-cta group flex h-[3.25rem] w-full items-center justify-center gap-2.5",
            "rounded-[var(--radius-lg)] text-[0.95rem] font-semibold text-white",
            "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-brand-blue)]",
            "disabled:pointer-events-none disabled:opacity-60",
          )}
        >
          {isSubmitting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin motion-reduce:animate-none" aria-hidden="true" />
              Signing in…
            </>
          ) : (
            <>
              Sign in
              <ArrowRight
                className="h-[1.1rem] w-[1.1rem] transition-transform duration-300 group-hover:translate-x-1 motion-reduce:transition-none motion-reduce:group-hover:translate-x-0"
                aria-hidden="true"
              />
            </>
          )}
        </button>
      </form>
    </div>
  );
}
