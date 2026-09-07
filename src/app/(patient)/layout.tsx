import type { ReactNode } from "react";
import { PortalShell } from "@/components/shell/PortalShell";
import { patientShellConfig } from "@/components/shell/nav-config";
import { requirePortalRole } from "@/lib/auth/require-portal";
import { prisma } from "@/lib/prisma";
import { hasUnreadForPatient } from "@/lib/data/messaging";

// Authoritative auth/RBAC gate for the Patient portal. See
// `src/lib/auth/require-portal.ts` for why this DB-backed check exists
// alongside `src/middleware.ts`'s cheaper cookie-presence check.
export default async function PatientPortalLayout({
  children,
}: {
  children: ReactNode;
}) {
  const session = await requirePortalRole("PATIENT");

  // The patient's own photo lives on the clinical Patient record (not
  // User.avatarUrl), so it's fetched separately for the shell's avatar.
  const patient = await prisma.patient.findUnique({ where: { userId: session.user.id } });
  const hasUnread = patient ? await hasUnreadForPatient(session.user.organizationId, patient.id) : false;

  return (
    <PortalShell
      {...patientShellConfig(
        { name: session.user.name, avatarUrl: patient?.photoUrl ?? undefined, role: "Patient" },
        hasUnread,
      )}
    >
      {children}
    </PortalShell>
  );
}
