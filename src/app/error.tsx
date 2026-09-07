"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Logo } from "@/components/ui/Logo";
import { Button } from "@/components/ui/Button";
import { WarningIcon } from "@/components/ui/icons/purity-raster-icons";

/**
 * Branded error boundary for the whole app (App Router convention — catches
 * any uncaught error thrown while rendering a route). Deliberately never
 * renders `error.message`/`error.stack` — those can carry details that
 * shouldn't reach the client (matches the same principle already applied to
 * `/api/health` and the auth actions elsewhere in this codebase). Next.js
 * still logs the full error server-side.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-background px-4 text-center">
      <Link href="/" className="rounded-[var(--radius-md)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-brand-blue)]">
        <Logo height={40} />
      </Link>

      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-error-bg text-error-text">
        <WarningIcon className="h-8 w-8" aria-hidden="true" />
      </div>

      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold text-text-primary">Something went wrong</h1>
        <p className="max-w-sm text-sm text-text-secondary">
          An unexpected error occurred. Try again, or head back to your dashboard.
        </p>
        {error.digest && (
          <p className="text-xs text-text-secondary">Reference: {error.digest}</p>
        )}
      </div>

      <div className="flex gap-3">
        <Button variant="outline" onClick={() => reset()}>
          Try again
        </Button>
        <Link href="/">
          <Button>Back to dashboard</Button>
        </Link>
      </div>
    </div>
  );
}
