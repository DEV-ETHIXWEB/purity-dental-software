import "server-only";
import { prisma } from "@/lib/prisma";

/**
 * The signed-in account's saved notification toggles.
 *
 * Returns a plain map so the Settings card can read it directly. An account
 * that has never touched Settings has no row value and gets `{}` — every
 * toggle then falls back to "on", which is how the app behaved before these
 * preferences were stored.
 */
export async function getNotificationPreferences(userId: string): Promise<Record<string, boolean>> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { notificationPreferences: true },
  });

  const stored = user?.notificationPreferences;
  if (!stored || typeof stored !== "object" || Array.isArray(stored)) return {};

  const preferences: Record<string, boolean> = {};
  for (const [key, value] of Object.entries(stored)) {
    if (typeof value === "boolean") preferences[key] = value;
  }
  return preferences;
}
