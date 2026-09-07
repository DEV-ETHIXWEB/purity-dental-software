"use server";

import { requireSession } from "@/lib/auth/authorize";
import { prisma } from "@/lib/prisma";
import { writeAuditLog } from "@/lib/auth/audit-log";

export interface UpdateProfileResult {
  ok: boolean;
  error?: string;
}

/**
 * Updates the SIGNED-IN user's own profile — every Settings page's "Save
 * changes" button, across all 4 portals. Always operates on the caller's
 * own account (id from the session, never a client-supplied id), so there's
 * no separate authorization check beyond "is someone signed in."
 *
 * PATIENT-role accounts store their contact phone on the clinical `Patient`
 * record (the field every staff portal actually reads via
 * ContactDetailsCard etc.), not on `User` — so this updates whichever
 * record is the real source of truth for the signed-in role.
 */
export async function updateMyProfile(data: { name: string; phone: string }): Promise<UpdateProfileResult> {
  const name = data.name.trim();
  const phone = data.phone.trim();
  if (!name) return { ok: false, error: "Name can't be empty." };

  try {
    const session = await requireSession();

    await prisma.user.update({
      where: { id: session.user.id },
      data: { name },
    });

    if (session.user.role === "PATIENT") {
      await prisma.patient.updateMany({
        where: { userId: session.user.id },
        data: { phone },
      });
    } else {
      await prisma.user.update({
        where: { id: session.user.id },
        data: { phone },
      });
    }

    await writeAuditLog({
      organizationId: session.user.organizationId,
      actorUserId: session.user.id,
      action: "account.profile_updated",
      resourceType: "User",
      resourceId: session.user.id,
    });

    return { ok: true };
  } catch {
    return { ok: false, error: "Couldn't save your changes. Please try again." };
  }
}
