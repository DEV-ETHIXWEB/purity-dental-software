import type { Metadata } from "next";
import { connection } from "next/server";
import { ForgotPasswordForm } from "@/components/auth/ForgotPasswordForm";

export const metadata: Metadata = {
  title: "Forgot Password",
  description: "Request a password reset link for your Purity account.",
};

/**
 * Unlike `/login` and `/reset-password` (which read `cookies()` /
 * `searchParams` and so are dynamically rendered automatically), this page
 * has no data dependency that forces dynamic rendering — Next.js would
 * otherwise statically prerender it at build time. `src/middleware.ts`
 * generates a FRESH CSP nonce per request and Next only stamps that nonce
 * onto a page's scripts/styles during server-side rendering of a dynamic
 * page (see node_modules/next/dist/docs/.../content-security-policy.md,
 * "How nonces work in Next.js"); a statically prerendered page's scripts
 * carry no nonce at all, so they get silently blocked by the strict
 * `script-src 'nonce-...' 'strict-dynamic'` CSP in production — the page
 * renders but never hydrates (client-side validation/submit silently do
 * nothing). `connection()` forces this page to render per-request so the
 * nonce is applied correctly, matching the other two auth pages' behavior.
 */
export default async function ForgotPasswordPage() {
  await connection();
  return (
    <div className="flex min-h-full w-full flex-1 items-center justify-center bg-surface-muted px-4 py-12">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-semibold text-text-primary">Purity</h1>
          <p className="text-sm text-text-secondary">Dental clinic practice management</p>
        </div>
        <ForgotPasswordForm />
      </div>
    </div>
  );
}
