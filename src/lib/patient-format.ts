import type { Patient } from "@/generated/prisma/client";

/**
 * Pure, client-safe patient formatting helpers — deliberately NOT in
 * `src/lib/data/patients.ts` (which is `"server-only"` and pulls in Prisma
 * transitively). Client Components need these two functions constantly
 * (name/age display), so they live in their own dependency-free module that
 * both server and client code can import.
 */

export function patientFullName(p: Pick<Patient, "firstName" | "lastName">): string {
  return `${p.firstName} ${p.lastName}`;
}

export function patientAge(p: Pick<Patient, "dateOfBirth">): number {
  const dob = p.dateOfBirth;
  const today = new Date();
  let age = today.getFullYear() - dob.getFullYear();
  const m = today.getMonth() - dob.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) age--;
  return age;
}
