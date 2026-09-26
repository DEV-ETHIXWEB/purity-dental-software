"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/auth/authorize";
import { writeAuditLog } from "@/lib/auth/audit-log";

export interface UpdateProfilePhotoResult {
  ok: boolean;
  error?: string;
}

/** Matches the clinical-document upload cap. */
const MAX_BYTES = 5 * 1024 * 1024;

const ALLOWED_TYPES = new Set(["image/png", "image/jpeg", "image/webp"]);

/**
 * Replaces the signed-in account's profile photo.
 *
 * "Change photo" was a disabled button on all four Settings pages. The bytes
 * go in the row (same reasoning as `Document.data` — there's no blob store
 * configured here) and `avatarUrl` is pointed at `/api/profile-photo/<id>`,
 * so every existing read path — top bar, sidebar, patient lists, schedule —
 * keeps working without knowing anything changed.
 *
 * A patient's photo lives on their clinical `Patient` record rather than the
 * `User` row, so that copy is updated too; otherwise a patient would change
 * their picture and still see the old one everywhere clinical staff look.
 */
export async function updateProfilePhoto(formData: FormData): Promise<UpdateProfilePhotoResult> {
  try {
    const session = await requireSession();

    const file = formData.get("photo");
    if (!(file instanceof File) || file.size === 0) {
      return { ok: false, error: "Choose an image to upload." };
    }
    if (file.size > MAX_BYTES) {
      return { ok: false, error: "That image is over 5MB. Try a smaller one." };
    }
    if (!ALLOWED_TYPES.has(file.type)) {
      return { ok: false, error: "Use a PNG, JPEG or WebP image." };
    }

    const bytes = Buffer.from(await file.arrayBuffer());

    // Cache-busted so the browser doesn't keep showing the previous photo at
    // the same URL — the path is stable, only this query string changes.
    const url = `/api/profile-photo/${session.user.id}?v=${Date.now()}`;

    await prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: session.user.id },
        data: { photoData: bytes, photoMimeType: file.type, avatarUrl: url },
      });
      await tx.patient.updateMany({
        where: { userId: session.user.id, organizationId: session.user.organizationId },
        data: { photoUrl: url },
      });
    });

    await writeAuditLog({
      organizationId: session.user.organizationId,
      actorUserId: session.user.id,
      action: "user.photo_updated",
      resourceType: "User",
      resourceId: session.user.id,
    });

    for (const path of ["/settings", "/hygienist/settings", "/receptionist/settings", "/patient/settings"]) {
      revalidatePath(path);
    }
    revalidatePath("/", "layout");

    return { ok: true };
  } catch {
    return { ok: false, error: "Couldn't upload that photo. Please try again." };
  }
}
