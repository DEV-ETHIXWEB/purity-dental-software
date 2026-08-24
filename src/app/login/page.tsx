import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentSession, dashboardPathForRole } from "@/lib/auth/session";
import { LoginForm } from "@/components/auth/LoginForm";

export const metadata: Metadata = {
  title: "Sign In",
  description: "Sign in to Purity.",
};

/**
 * Standalone login page — not part of any portal route group, so it
 * doesn't render inside `PortalShell` (no sidebar/topbar; this is where an
 * unauthenticated visitor lands). If a valid session already exists,
 * redirect straight to that user's portal rather than showing the form
 * again.
 */
export default async function LoginPage() {
  const session = await getCurrentSession();
  if (session) {
    redirect(dashboardPathForRole(session.user.role));
  }

  return (
    <div className="flex min-h-full w-full flex-1 items-center justify-center bg-surface-muted px-4 py-12">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-semibold text-text-primary">Purity</h1>
          <p className="text-sm text-text-secondary">Dental clinic practice management</p>
        </div>
        <LoginForm />
      </div>
    </div>
  );
}
