import "server-only";
import { redirect } from "next/navigation";
import { getCurrentSession, dashboardPathForRole } from "@/lib/auth/session";
import type { UserRole } from "@/generated/prisma/client";

/**
 * Layout-level portal gate: resolves the real (DB-backed) session and
 * redirects appropriately. Complements `src/middleware.ts`, which can only
 * cheaply check "is there a session cookie at all" at the Edge — this is
 * the authoritative check that also verifies role, expiry, and account
 * `isActive`, and is where an authenticated-but-wrong-role visitor gets
 * sent to their OWN portal's dashboard (not a generic error page, per the
 * task spec).
 *
 * Call this from each portal route group's `layout.tsx` with the one role
 * that portal belongs to.
 */
export async function requirePortalRole(allowedRole: UserRole) {
  const session = await getCurrentSession();

  if (!session) {
    redirect("/login");
  }

  if (session.user.role !== allowedRole) {
    redirect(dashboardPathForRole(session.user.role));
  }

  return session;
}
