import "server-only";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { generateToken, hashToken } from "@/lib/auth/tokens";
import { isProduction } from "@/lib/env";
import type { UserPresence, UserRole } from "@/generated/prisma/client";

/**
 * Session management — the single source of truth for "who is signed in."
 *
 * Every protected route/Server Action/Route Handler must resolve the current
 * user through `getCurrentSession()` (or the `requireSession`/`requireRole`
 * wrappers in `src/lib/auth/authorize.ts`), never by any other means (e.g.
 * trusting a client-supplied role, or assuming middleware already checked —
 * middleware is necessary but not sufficient, see `authorize.ts`).
 */

export const SESSION_COOKIE_NAME = "purity_session";
const SESSION_TTL_MS = 1000 * 60 * 60 * 24 * 7; // 7 days
/** Lifetime when the user did NOT tick "Remember me" on the sign-in form. */
const SESSION_SHORT_TTL_MS = 1000 * 60 * 60 * 12; // 12 hours

/** Shape returned to callers — deliberately excludes passwordHash and other sensitive columns. */
export interface SessionUser {
  id: string;
  organizationId: string;
  role: UserRole;
  email: string;
  name: string;
  phone: string | null;
  avatarUrl: string | null;
  /** Available / away, shown as a dot on this user's avatar across the shell. */
  presence: UserPresence;
  /**
   * Raw per-person permission exceptions. Kept unparsed here so the session
   * stays a straight projection of the row; read it through
   * `hasPermission`/`effectivePermissions` in `auth/permissions.ts` rather
   * than inspecting it directly.
   */
  permissionOverrides: unknown;
}

export interface CurrentSession {
  sessionId: string;
  user: SessionUser;
  expiresAt: Date;
}

/**
 * Create a new session for a just-authenticated user: generate a random
 * token, persist a hash of it, and set the httpOnly session cookie on the
 * response. Call this only after password verification has already
 * succeeded (see `src/lib/auth/login.ts`).
 *
 * `remember` is the sign-in form's "Remember me" box. Ticked (the default,
 * and the behaviour every existing caller had before the flag existed): a
 * 7-day session with a persistent cookie. Unticked: a 12-hour session whose
 * cookie omits `expires`, making it a browser-session cookie that dies when
 * the window closes — the point of the control is that a shared
 * front-desk machine doesn't stay signed in overnight.
 *
 * NOTE: this performs a real Prisma write and will only succeed once a live
 * database is connected — that's expected in this phase of the project.
 */
export async function createSession(
  userId: string,
  { remember = true }: { remember?: boolean } = {},
): Promise<void> {
  const rawToken = generateToken();
  const tokenHash = hashToken(rawToken);
  const expiresAt = new Date(
    Date.now() + (remember ? SESSION_TTL_MS : SESSION_SHORT_TTL_MS),
  );

  await prisma.session.create({
    data: { userId, tokenHash, expiresAt },
  });

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, rawToken, {
    httpOnly: true,
    secure: isProduction(),
    sameSite: "lax",
    path: "/",
    // Server-side expiry still applies either way; this only decides whether
    // the cookie survives a browser restart.
    ...(remember ? { expires: expiresAt } : {}),
  });
}

/**
 * Resolve the current request's session + user from the session cookie, or
 * `null` if there is none / it's expired / it's invalid / the account has
 * been deactivated. Deliberately fails closed: any error resolving the
 * session (including "no database connection yet") is treated as "not
 * signed in" rather than thrown, since raw DB errors must never surface to
 * the client as a stack trace (see `/api/health` and the login action for
 * the same principle).
 */
export async function getCurrentSession(): Promise<CurrentSession | null> {
  const cookieStore = await cookies();
  const rawToken = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  if (!rawToken) return null;

  const tokenHash = hashToken(rawToken);

  try {
    const session = await prisma.session.findUnique({
      where: { tokenHash },
      include: { user: true },
    });

    if (!session) return null;
    if (session.expiresAt.getTime() <= Date.now()) {
      // Best-effort cleanup of the expired row; don't fail the request if this errors.
      await prisma.session.delete({ where: { id: session.id } }).catch(() => {});
      return null;
    }
    if (!session.user.isActive) return null;

    return {
      sessionId: session.id,
      expiresAt: session.expiresAt,
      user: {
        id: session.user.id,
        organizationId: session.user.organizationId,
        role: session.user.role,
        email: session.user.email,
        name: session.user.name,
        phone: session.user.phone,
        avatarUrl: session.user.avatarUrl,
        presence: session.user.presence,
        permissionOverrides: session.user.permissionOverrides,
      },
    };
  } catch {
    // No live DB yet (or a transient DB error) — treat as unauthenticated
    // rather than letting a Prisma/connection error bubble up to the client.
    return null;
  }
}

/** Clear the session cookie and invalidate the underlying session record. Safe to call even if already signed out. */
export async function destroySession(): Promise<void> {
  const cookieStore = await cookies();
  const rawToken = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  cookieStore.delete(SESSION_COOKIE_NAME);

  if (!rawToken) return;
  const tokenHash = hashToken(rawToken);
  await prisma.session.deleteMany({ where: { tokenHash } }).catch(() => {});
}

/** Portal home path per role — used by login redirect and the root `/` page. */
export function dashboardPathForRole(role: UserRole): string {
  switch (role) {
    case "DENTIST":
      return "/dashboard";
    case "HYGIENIST":
      return "/hygienist/dashboard";
    case "RECEPTIONIST":
      return "/receptionist/dashboard";
    case "PATIENT":
      return "/patient/dashboard";
    case "ADMIN":
      return "/admin/dashboard";
    default:
      return "/login";
  }
}
