"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/auth/authorize";
import type { UserPresence } from "@/generated/prisma/client";

export interface SetPresenceResult {
  ok: boolean;
  error?: string;
}

/**
 * Sets the signed-in user's own presence — available, or stepped away.
 *
 * Deliberately only ever acts on `session.user.id`: no id comes off the wire,
 * so there is no way to shape a request that marks a colleague away. This is
 * presence, not access — disabling an account is `User.isActive`, which lives
 * on the receptionist's Team screen and is a different decision.
 */
export async function setPresence(presence: UserPresence): Promise<SetPresenceResult> {
  try {
    const session = await requireSession();

    if (presence !== "AVAILABLE" && presence !== "AWAY") {
      return { ok: false, error: "That isn't a valid status." };
    }

    await prisma.user.update({
      where: { id: session.user.id },
      data: { presence },
    });

    // The avatar carrying the dot sits in the shell, so the whole tree needs
    // to re-render, not just the settings page.
    revalidatePath("/", "layout");

    return { ok: true };
  } catch {
    return { ok: false, error: "Couldn't update your status. Please try again." };
  }
}
