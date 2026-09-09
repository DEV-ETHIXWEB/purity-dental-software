"use server";

import { requireRole } from "@/lib/auth/authorize";
import { prisma } from "@/lib/prisma";

/**
 * Marks the signed-in patient as having seen the first-run intro carousel.
 *
 * Always operates on the caller's own account (id from the session, never a
 * client-supplied id), so there's nothing here for a crafted request to
 * target but itself — the worst a direct call can do is skip an intro the
 * caller was about to be shown anyway.
 *
 * Idempotent: `updateMany` with a `null` guard means replaying the call
 * (double-tap on "Get started", a retried request) can't move an already
 * recorded timestamp forward.
 */
export async function completeOnboarding(): Promise<void> {
  const session = await requireRole(["PATIENT"]);

  await prisma.user.updateMany({
    where: { id: session.user.id, onboardedAt: null },
    data: { onboardedAt: new Date() },
  });
}
