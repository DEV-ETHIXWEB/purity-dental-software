"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/auth/authorize";
import { writeAuditLog } from "@/lib/auth/audit-log";

export interface UpdatePracticeResult {
  ok: boolean;
  error?: string;
}

/**
 * Whether a string is an IANA zone this runtime actually knows.
 *
 * Checked rather than trusted because the value drives every date and time
 * the app renders (see `src/lib/datetime.ts`): a bad zone saved here would
 * throw inside `Intl.DateTimeFormat` on pages across all four portals, not
 * just on this form.
 */
function isValidTimeZone(zone: string): boolean {
  try {
    new Intl.DateTimeFormat("en-US", { timeZone: zone });
    return true;
  } catch {
    return false;
  }
}

/** Practice-level settings, edited by an admin. */
export async function updatePractice(params: {
  name: string;
  timezone: string;
  phone?: string;
  email?: string;
  addressLine?: string;
}): Promise<UpdatePracticeResult> {
  try {
    const session = await requirePermission("practice.manage");
    const organizationId = session.user.organizationId;

    const name = params.name.trim();
    const timezone = params.timezone.trim();

    if (!name) return { ok: false, error: "Practice name is required." };
    if (!isValidTimeZone(timezone)) {
      return { ok: false, error: "That isn't a recognised timezone." };
    }

    const before = await prisma.organization.findUnique({
      where: { id: organizationId },
      select: { name: true, timezone: true },
    });
    if (!before) return { ok: false, error: "Practice not found." };

    await prisma.organization.update({
      where: { id: organizationId },
      data: {
        name,
        timezone,
        phone: params.phone?.trim() || null,
        email: params.email?.trim() || null,
        addressLine: params.addressLine?.trim() || null,
      },
    });

    await writeAuditLog({
      organizationId,
      actorUserId: session.user.id,
      action: "practice.updated",
      resourceType: "Organization",
      resourceId: organizationId,
      metadata: {
        from: { name: before.name, timezone: before.timezone },
        to: { name, timezone },
      },
    });

    // The timezone feeds every portal's shell, so a change here has to
    // invalidate all of them, not just the page that made it.
    for (const path of [
      "/admin/practice",
      "/admin/dashboard",
      "/dashboard",
      "/hygienist/dashboard",
      "/receptionist/dashboard",
      "/patient/dashboard",
    ]) {
      revalidatePath(path);
    }

    return { ok: true };
  } catch {
    return { ok: false, error: "Couldn't save practice settings. Please try again." };
  }
}
