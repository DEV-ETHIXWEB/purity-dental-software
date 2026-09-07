import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentSession, dashboardPathForRole } from "@/lib/auth/session";
import { AuthLayout } from "@/components/auth/AuthLayout";
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
    <AuthLayout>
      <LoginForm />
    </AuthLayout>
  );
}
