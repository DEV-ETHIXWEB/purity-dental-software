"use server";

import { prisma } from "@/lib/prisma";
import { requireRole, AuthorizationError } from "@/lib/auth/authorize";
import { writeAuditLog } from "@/lib/auth/audit-log";
import { patientRegistrationSchema } from "@/lib/patient-registration-schema";

/**
 * Register-patient Server Action — the task's demonstrated example of
 * defense-in-depth server-side authorization on a real mutation.
 *
 * `src/middleware.ts` already blocks unauthenticated requests to
 * `/receptionist/*`, and `src/app/receptionist/layout.tsx` re-verifies the
 * session server-side. NEITHER of those runs for this Server Action if it's
 * invoked directly (e.g. a crafted fetch to the action's endpoint, bypassing
 * the page entirely) — Server Actions are callable independent of which
 * page rendered the form that normally triggers them. So this function
 * independently re-derives the session and role here; it must never assume
 * "the caller already passed middleware."
 */

export type RegisterPatientResult =
  | { status: "success"; patientId: string }
  | { status: "error"; message: string; fieldErrors?: Record<string, string> };

export async function registerPatient(
  formData: FormData,
): Promise<RegisterPatientResult> {
  // 1. Validate input shape with Zod BEFORE touching auth/DB — cheap to
  // reject malformed input early, and avoids doing an auth check work for
  // a request that's going to fail validation anyway. (Auth is still
  // checked before any data is read/written — see step 2.)
  const raw = {
    firstName: String(formData.get("firstName") ?? ""),
    lastName: String(formData.get("lastName") ?? ""),
    dateOfBirth: String(formData.get("dateOfBirth") ?? ""),
    sex: String(formData.get("sex") ?? ""),
    phone: String(formData.get("phone") ?? ""),
    email: String(formData.get("email") ?? ""),
    insuranceProvider: String(formData.get("insuranceProvider") ?? ""),
    insurancePlan: String(formData.get("insurancePlan") ?? ""),
  };

  const parsed = patientRegistrationSchema.safeParse(raw);
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

  // 2. Require a signed-in RECEPTIONIST (or ADMIN) — the actual security
  // boundary. Registering a patient is front-desk work; other portals
  // don't get this action.
  let session;
  try {
    session = await requireRole(["RECEPTIONIST", "ADMIN"]);
  } catch (error) {
    if (error instanceof AuthorizationError) {
      return { status: "error", message: error.message };
    }
    return { status: "error", message: "Something went wrong. Please try again." };
  }

  // 3. Multi-tenant isolation: the new patient is created under the
  // SIGNED-IN USER'S OWN organizationId — never a client-supplied value.
  // If this ever accepted `organizationId` from the form/client, a
  // receptionist at Clinic A could (accidentally or maliciously) create a
  // patient record inside Clinic B's tenant. Deriving it exclusively from
  // the server-verified session is what makes that impossible.
  const data = parsed.data;

  try {
    const patient = await prisma.patient.create({
      data: {
        organizationId: session.user.organizationId,
        firstName: data.firstName,
        lastName: data.lastName,
        dateOfBirth: new Date(data.dateOfBirth),
        sex: data.sex,
        phone: data.phone,
        email: data.email,
        insuranceProvider: data.insuranceProvider,
        insurancePlan: data.insurancePlan,
      },
    });

    await writeAuditLog({
      organizationId: session.user.organizationId,
      actorUserId: session.user.id,
      action: "patient.registered",
      resourceType: "Patient",
      resourceId: patient.id,
      metadata: { firstName: data.firstName, lastName: data.lastName },
    });

    return { status: "success", patientId: patient.id };
  } catch {
    // No live database yet (or a transient DB error) — never surface a raw
    // Prisma/connection error to the client.
    return {
      status: "error",
      message: "Patient registration is temporarily unavailable. Please try again shortly.",
    };
  }
}
