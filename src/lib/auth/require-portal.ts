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

  // ADMIN has superset access to every portal (see dashboardPathForRole,
  // which currently points ADMIN at this same Dentist portal) — exempt it
  // from the wrong-role redirect, otherwise an admin visiting /dashboard
  // would be redirected back to /dashboard forever.
  if (session.user.role !== allowedRole && session.user.role !== "ADMIN") {
    redirect(dashboardPathForRole(session.user.role));
  }

  return session;
}

/**
 * Page-level role gate. Same rule as `requirePortalRole`, but takes the list
 * of roles a page allows rather than the one role a portal belongs to.
 *
 * Exists because pages previously used `requireRole` from `authorize.ts`,
 * which *throws* on a wrong role. A page and its layout render concurrently,
 * so that throw raced the layout's redirect: usually the redirect won and the
 * visitor landed on their own dashboard, but when the throw won first they
 * got the "Something went wrong" boundary instead. A visitor opening a page
 * meant for another role has made a navigation mistake, not triggered a
 * crash, so this always redirects them to their own portal.
 *
 * `requireRole` stays as-is and is still the right call in Server Actions and
 * Route Handlers, where there is no page to redirect and the caller needs a
 * typed failure it can return to the client.
 */
export async function requirePageRole(allowedRoles: UserRole[]) {
  const session = await getCurrentSession();

  if (!session) {
    redirect("/login");
  }

  if (!allowedRoles.includes(session.user.role)) {
    redirect(dashboardPathForRole(session.user.role));
  }

  return session;
}
