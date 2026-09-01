import "server-only";
import { UserRole } from "@/generated/prisma/client";
import { getCurrentSession, type CurrentSession } from "@/lib/auth/session";

/**
 * Server-enforced RBAC helpers.
 *
 * `src/middleware.ts` gates whole route groups by path prefix (redirects
 * unauthenticated visitors to `/login`, and authenticated-but-wrong-role
 * visitors to their own portal). That is necessary but NOT sufficient:
 * Server Actions and Route Handlers can be invoked directly (fetch/curl/a
 * malicious client bundle) without ever going through the page that renders
 * a matching UI, so middleware's path-based gate never runs for them. Every
 * Server Action or Route Handler that reads or mutates data must
 * independently call `requireSession()` / `requireRole()` itself — never
 * assume "middleware already checked this."
 */

export { UserRole };

/** Thrown by `requireSession`/`requireRole` on failure. Server Actions should catch and translate to a typed error result rather than let this become an unhandled 500. */
export class AuthorizationError extends Error {
  constructor(
    message: string,
    public readonly code: "UNAUTHENTICATED" | "FORBIDDEN",
  ) {
    super(message);
    this.name = "AuthorizationError";
  }
}

/** Require a signed-in user (any role). Throws `AuthorizationError("UNAUTHENTICATED")` if not. */
export async function requireSession(): Promise<CurrentSession> {
  const session = await getCurrentSession();
  if (!session) {
    throw new AuthorizationError("You must be signed in.", "UNAUTHENTICATED");
  }
  return session;
}

/**
 * Require a signed-in user whose role is in `allowedRoles`. Throws
 * `AuthorizationError("FORBIDDEN")` if signed in but the wrong role, or
 * `"UNAUTHENTICATED"` if not signed in at all.
 */
export async function requireRole(
  allowedRoles: UserRole[],
): Promise<CurrentSession> {
  const session = await requireSession();
  if (!allowedRoles.includes(session.user.role)) {
    throw new AuthorizationError(
      "You don't have permission to perform this action.",
      "FORBIDDEN",
    );
  }
  return session;
}

/**
 * Assert that a resource's `organizationId` matches the signed-in user's
 * own `organizationId`. This is the multi-tenant isolation check: without
 * it, a valid, correctly-authenticated user at Clinic A could pass the id
 * of a resource belonging to Clinic B and — since role checks alone say
 * nothing about *which* organization's data is being touched — read or
 * mutate another tenant's records. Every mutation that loads a resource by
 * id must call this (or an equivalent `where: { id, organizationId }`
 * clause on the query itself, which is even better since it also avoids
 * leaking a 404-vs-403 timing/existence signal across tenants).
 */
export function assertSameOrganization(
  session: CurrentSession,
  resourceOrganizationId: string,
): void {
  if (session.user.organizationId !== resourceOrganizationId) {
    throw new AuthorizationError(
      "You don't have permission to access this resource.",
      "FORBIDDEN",
    );
  }
}
