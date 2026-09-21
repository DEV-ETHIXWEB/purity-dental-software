"use server";

import { randomBytes } from "node:crypto";
import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth/authorize";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/auth/password";
import { writeAuditLog } from "@/lib/auth/audit-log";
import type { UserRole } from "@/generated/prisma/client";

/**
 * Front-desk management of clinical staff accounts — the "doctor" half of the
 * receptionist's "Doctor & patient management".
 *
 * Deliberately narrow: a receptionist can add a clinician, correct their
 * details, and switch them off when they leave. They cannot create another
 * receptionist or an admin, and cannot set anyone's password — a new account
 * gets a one-time temporary password shown once, which the clinician replaces
 * via the existing reset flow.
 */

interface ActionResult {
  ok: boolean;
  error?: string;
}

const MANAGERS = ["RECEPTIONIST", "ADMIN"] as const;
/** The only roles this screen may create — never RECEPTIONIST/ADMIN (privilege escalation) or PATIENT. */
const CLINICAL_ROLES = new Set<UserRole>(["DENTIST", "HYGIENIST"]);

/** Readable but high-entropy: 16 hex chars ≈ 64 bits, fine for a single-use handover. */
function temporaryPassword(): string {
  return randomBytes(8).toString("hex");
}

export async function createProvider(input: {
  name: string;
  email: string;
  role: UserRole;
}): Promise<ActionResult & { temporaryPassword?: string }> {
  try {
    const session = await requireRole([...MANAGERS]);

    const name = input.name.trim();
    const email = input.email.trim().toLowerCase();
    if (name.length < 2) return { ok: false, error: "Enter the clinician's full name." };
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return { ok: false, error: "Enter a valid email address." };
    if (!CLINICAL_ROLES.has(input.role)) return { ok: false, error: "Pick Dentist or Hygienist." };

    const existing = await prisma.user.findUnique({ where: { email }, select: { id: true } });
    if (existing) return { ok: false, error: "An account already uses that email." };

    const password = temporaryPassword();
    const created = await prisma.user.create({
      data: {
        organizationId: session.user.organizationId,
        name,
        email,
        role: input.role,
        passwordHash: await hashPassword(password),
      },
      select: { id: true },
    });

    await writeAuditLog({
      organizationId: session.user.organizationId,
      actorUserId: session.user.id,
      action: "provider.create",
      resourceType: "User",
      resourceId: created.id,
      metadata: { email, role: input.role },
    });

    revalidatePath("/receptionist/providers");
    return { ok: true, temporaryPassword: password };
  } catch {
    return { ok: false, error: "Couldn't add that clinician. Please try again." };
  }
}

export async function updateProvider(input: {
  providerId: string;
  name: string;
  email: string;
}): Promise<ActionResult> {
  try {
    const session = await requireRole([...MANAGERS]);
    const name = input.name.trim();
    const email = input.email.trim().toLowerCase();
    if (name.length < 2) return { ok: false, error: "Enter the clinician's full name." };
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return { ok: false, error: "Enter a valid email address." };

    const provider = await prisma.user.findFirst({
      where: {
        id: input.providerId,
        organizationId: session.user.organizationId,
        role: { in: ["DENTIST", "HYGIENIST"] },
      },
      select: { id: true },
    });
    if (!provider) return { ok: false, error: "Clinician not found." };

    const clash = await prisma.user.findFirst({
      where: { email, id: { not: provider.id } },
      select: { id: true },
    });
    if (clash) return { ok: false, error: "Another account already uses that email." };

    await prisma.user.update({ where: { id: provider.id }, data: { name, email } });
    await writeAuditLog({
      organizationId: session.user.organizationId,
      actorUserId: session.user.id,
      action: "provider.update",
      resourceType: "User",
      resourceId: provider.id,
      metadata: { email },
    });

    revalidatePath("/receptionist/providers");
    return { ok: true };
  } catch {
    return { ok: false, error: "Couldn't save those changes. Please try again." };
  }
}

export async function setProviderActive(providerId: string, isActive: boolean): Promise<ActionResult> {
  try {
    const session = await requireRole([...MANAGERS]);
    const provider = await prisma.user.findFirst({
      where: {
        id: providerId,
        organizationId: session.user.organizationId,
        role: { in: ["DENTIST", "HYGIENIST"] },
      },
      select: { id: true },
    });
    if (!provider) return { ok: false, error: "Clinician not found." };

    await prisma.user.update({
      where: { id: provider.id },
      data: { isActive, disabledAt: isActive ? null : new Date() },
    });

    // Switching an account off must end its live sessions, or the person
    // stays signed in until their cookie happens to expire.
    if (!isActive) {
      await prisma.session.deleteMany({ where: { userId: provider.id } });
    }

    await writeAuditLog({
      organizationId: session.user.organizationId,
      actorUserId: session.user.id,
      action: isActive ? "provider.enable" : "provider.disable",
      resourceType: "User",
      resourceId: provider.id,
    });

    revalidatePath("/receptionist/providers");
    return { ok: true };
  } catch {
    return { ok: false, error: "Couldn't update that account. Please try again." };
  }
}
