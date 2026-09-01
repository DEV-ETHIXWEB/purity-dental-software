"use server";

import { headers } from "next/headers";
import { prisma } from "@/lib/prisma";
import { verifyPassword } from "@/lib/auth/password";
import { createSession, dashboardPathForRole } from "@/lib/auth/session";
import { checkRateLimit, loginRateLimitKey } from "@/lib/auth/rate-limit";
import { loginSchema } from "@/lib/validation/auth";
import { writeAuditLog } from "@/lib/auth/audit-log";

/**
 * Login Server Action. This is the actual security boundary — the `/login`
 * page's client-side "required" attributes are UX affordances only.
 *
 * Deliberately generic failure messaging throughout: whether the email
 * doesn't exist, the password is wrong, or the account is disabled, the
 * caller sees the same "Invalid email or password." This avoids a
 * user-enumeration leak (an attacker probing which emails have accounts).
 */

export type LoginResult =
  | { status: "success"; redirectTo: string }
  | { status: "error"; message: string }
  | { status: "rate_limited"; message: string };

async function getClientIp(): Promise<string> {
  const headerList = await headers();
  // x-forwarded-for can contain a comma-separated chain; the first entry is
  // the original client as seen by the nearest proxy. This is
  // spoofable-by-design as raw header input (a client can send any value),
  // so it's a rate-limit heuristic, not an identity/authorization signal.
  const forwardedFor = headerList.get("x-forwarded-for");
  if (forwardedFor) return forwardedFor.split(",")[0]!.trim();
  return "unknown";
}

export async function login(formData: FormData): Promise<LoginResult> {
  const raw = {
    email: String(formData.get("email") ?? ""),
    password: String(formData.get("password") ?? ""),
  };

  const parsed = loginSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      status: "error",
      message: parsed.error.issues[0]?.message ?? "Invalid input.",
    };
  }
  const { email, password } = parsed.data;

  const ip = await getClientIp();
  const rateLimit = checkRateLimit(loginRateLimitKey(ip, email));
  if (!rateLimit.allowed) {
    return {
      status: "rate_limited",
      message: "Too many attempts. Please try again in a few minutes.",
    };
  }

  const GENERIC_FAILURE = "Invalid email or password.";

  try {
    const user = await prisma.user.findUnique({ where: { email } });

    // Always run a bcrypt compare, even when no user was found, using a
    // fixed dummy hash — this keeps response timing similar for
    // "no such email" vs. "wrong password", closing a timing side-channel
    // that would otherwise leak which emails exist.
    const DUMMY_HASH =
      "$2a$12$CwTycUXWue0Thq9StjUM0uJ8i6t0/nD5DzO5U0jV2q1o1r1o1r1o1";
    const isValid = await verifyPassword(
      password,
      user?.passwordHash ?? DUMMY_HASH,
    );

    if (!user || !isValid || !user.isActive) {
      return { status: "error", message: GENERIC_FAILURE };
    }

    await createSession(user.id);

    await writeAuditLog({
      organizationId: user.organizationId,
      actorUserId: user.id,
      action: "auth.login",
      resourceType: "User",
      resourceId: user.id,
    });

    return {
      status: "success",
      redirectTo: dashboardPathForRole(user.role),
    };
  } catch {
    // No live database yet (or a transient connection error) — surface a
    // clear, generic "service unavailable" rather than letting a Prisma
    // connection error or stack trace reach the client.
    return {
      status: "error",
      message:
        "Sign-in is temporarily unavailable. Please try again shortly.",
    };
  }
}
