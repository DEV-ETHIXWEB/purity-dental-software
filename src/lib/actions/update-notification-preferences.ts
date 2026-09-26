"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/auth/authorize";

export interface UpdateNotificationPreferencesResult {
  ok: boolean;
  error?: string;
}

/**
 * Persists the Settings page's delivery toggles.
 *
 * These switches used to render `defaultChecked` and throw the change away —
 * the card said so in small print, which is honest but still ships a control
 * that forgets what you set. They now write to `User.notificationPreferences`.
 *
 * Only the ids the caller sends are stored, and a missing key means "on", so
 * the stored shape follows whatever the portal currently offers instead of
 * needing a migration every time a toggle is added or renamed.
 */
export async function updateNotificationPreferences(
  preferences: Record<string, boolean>,
): Promise<UpdateNotificationPreferencesResult> {
  try {
    const session = await requireSession();

    const entries = Object.entries(preferences);
    if (entries.length > 32) {
      return { ok: false, error: "Too many preferences." };
    }
    // Never trust the shape off the wire — this lands in a Json column.
    const clean: Record<string, boolean> = {};
    for (const [key, value] of entries) {
      if (typeof key === "string" && key.length <= 64 && typeof value === "boolean") {
        clean[key] = value;
      }
    }

    await prisma.user.update({
      where: { id: session.user.id },
      data: { notificationPreferences: clean },
    });

    for (const path of ["/settings", "/hygienist/settings", "/receptionist/settings", "/patient/settings"]) {
      revalidatePath(path);
    }

    return { ok: true };
  } catch {
    return { ok: false, error: "Couldn't save your preferences. Please try again." };
  }
}
