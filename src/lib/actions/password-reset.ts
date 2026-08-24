"use server";

import { prisma } from "@/lib/prisma";
import { generateToken, hashToken } from "@/lib/auth/tokens";
import { hashPassword } from "@/lib/auth/password";
import {
  requestPasswordResetSchema,
  resetPasswordSchema,
} from "@/lib/validation/auth";

/**
 * Password reset flow: request a reset link, then complete the reset with
 * the token from that link.
 *
 * Email delivery stub: this project has no transactional email provider
 * wired up yet. In development, the reset link is logged to the server
 * console so the flow is exercisable end-to-end locally. Before shipping
 * this to real users, replace the `console.log` below with a real
 * transactional email send (e.g. Postmark/SES/Resend) — that's tracked as
 * a follow-up, not done here, since it needs real provider credentials.
 */

const RESET_TOKEN_TTL_MS = 1000 * 60 * 30; // 30 minutes

export type RequestPasswordResetResult =
  | { status: "success"; message: string }
  | { status: "error"; message: string };

export async function requestPasswordReset(
  formData: FormData,
): Promise<RequestPasswordResetResult> {
  const parsed = requestPasswordResetSchema.safeParse({
    email: String(formData.get("email") ?? ""),
  });

  // Same message whether validation succeeds or the email doesn't exist —
  // see below. A malformed email at least gets a slightly more useful
  // message since that's a client-side typo, not an enumeration signal.
  if (!parsed.success) {
    return {
      status: "error",
      message: parsed.error.issues[0]?.message ?? "Enter a valid email address.",
    };
  }

  // Always return the same generic "if an account exists" message
  // regardless of whether the email matches a user — this is the same
  // user-enumeration protection as the login form's generic error.
  const GENERIC_MESSAGE =
    "If an account exists for that email, a password reset link has been sent.";

  try {
    const user = await prisma.user.findUnique({
      where: { email: parsed.data.email },
    });

    if (user && user.isActive) {
      const rawToken = generateToken();
      const tokenHash = hashToken(rawToken);
      const expiresAt = new Date(Date.now() + RESET_TOKEN_TTL_MS);

      await prisma.passwordResetToken.create({
        data: { userId: user.id, tokenHash, expiresAt },
      });

      const resetLink = `${
        process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"
      }/reset-password?token=${rawToken}`;

      // DEV-ONLY STUB: log instead of emailing. See file header comment —
      // a real transactional email provider is a follow-up, not built here.
      if (process.env.NODE_ENV !== "production") {
        console.log(`[password-reset] Reset link for ${user.email}: ${resetLink}`);
      } else {
        // In production, this stub cannot deliver the link to the user at
        // all yet. Log server-side (not to the client response) so the
        // gap is visible in ops rather than silently failing.
        console.error(
          "[password-reset] No email provider configured — reset link was generated but NOT delivered to the user.",
        );
      }
    }

    return { status: "success", message: GENERIC_MESSAGE };
  } catch {
    return {
      status: "error",
      message: "Password reset is temporarily unavailable. Please try again shortly.",
    };
  }
}

export type ResetPasswordResult =
  | { status: "success"; message: string }
  | { status: "error"; message: string; fieldErrors?: Record<string, string> };

export async function resetPassword(
  formData: FormData,
): Promise<ResetPasswordResult> {
  const parsed = resetPasswordSchema.safeParse({
    token: String(formData.get("token") ?? ""),
    password: String(formData.get("password") ?? ""),
    confirmPassword: String(formData.get("confirmPassword") ?? ""),
  });

  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const field = issue.path[0];
      if (typeof field === "string" && !fieldErrors[field]) {
        fieldErrors[field] = issue.message;
      }
    }
    return {
      status: "error",
      message: parsed.error.issues[0]?.message ?? "Invalid input.",
      fieldErrors,
    };
  }

  const tokenHash = hashToken(parsed.data.token);

  try {
    const resetToken = await prisma.passwordResetToken.findUnique({
      where: { tokenHash },
    });

    if (
      !resetToken ||
      resetToken.usedAt ||
      resetToken.expiresAt.getTime() <= Date.now()
    ) {
      return {
        status: "error",
        message: "This reset link is invalid or has expired. Please request a new one.",
      };
    }

    const passwordHash = await hashPassword(parsed.data.password);

    await prisma.$transaction([
      prisma.user.update({
        where: { id: resetToken.userId },
        data: { passwordHash },
      }),
      prisma.passwordResetToken.update({
        where: { id: resetToken.id },
        data: { usedAt: new Date() },
      }),
      // Invalidate all existing sessions for this user — a password reset
      // should log out anyone (including an attacker) holding a stale
      // session token.
      prisma.session.deleteMany({ where: { userId: resetToken.userId } }),
    ]);

    return {
      status: "success",
      message: "Your password has been reset. You can now sign in.",
    };
  } catch {
    return {
      status: "error",
      message: "Password reset is temporarily unavailable. Please try again shortly.",
    };
  }
}
