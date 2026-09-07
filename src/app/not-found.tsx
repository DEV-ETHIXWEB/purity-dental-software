import Link from "next/link";
import { Logo } from "@/components/ui/Logo";
import { Button } from "@/components/ui/Button";
import { SearchIcon } from "@/components/ui/icons/purity-raster-icons";

/**
 * Branded 404 — replaces Next's default unstyled not-found page for every
 * route that doesn't match (App Router picks this up automatically).
 */
export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-background px-4 text-center">
      <Link href="/" className="rounded-[var(--radius-md)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-brand-blue)]">
        <Logo height={40} />
      </Link>

      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-surface-sunken text-text-secondary">
        <SearchIcon className="h-8 w-8" aria-hidden="true" />
      </div>

      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold text-text-primary">Page not found</h1>
        <p className="max-w-sm text-sm text-text-secondary">
          The page you&apos;re looking for doesn&apos;t exist or may have moved.
        </p>
      </div>

      <Link href="/">
        <Button>Back to dashboard</Button>
      </Link>
    </div>
  );
}
