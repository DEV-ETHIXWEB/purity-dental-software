import type { ReactNode } from "react";
import { PortalShell } from "@/components/shell/PortalShell";
import { patientShellConfig } from "@/components/shell/nav-config";
import { requirePortalRole } from "@/lib/auth/require-portal";
import { prisma } from "@/lib/prisma";
import { hasUnreadForPatient } from "@/lib/data/messaging";
import { getOrganization } from "@/lib/data/organization";
import { patientNotifications } from "@/lib/data/notifications";
import { PatientOnboarding } from "@/components/patient/PatientOnboarding";
import { HelpFab } from "@/components/patient/HelpFab";

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
  const notifications = patient
    ? await patientNotifications(session.user.organizationId, patient.id, {
        messagesHref: "/patient/messages",
        patientsHref: "/patient/dashboard",
        billingHref: "/patient/billing",
        appointmentsHref: "/patient/appointments",
      })
    : [];

  // First-run intro gate. `onboardedAt` isn't on the session (which is
  // cached per request for auth, not for UI state), so it's read here —
  // the one place every Patient route passes through, so a new patient
  // gets the intro whatever URL they land on, not just the dashboard.
  const [account, organization] = await Promise.all([
    prisma.user.findUnique({
      where: { id: session.user.id },
      select: { onboardedAt: true },
    }),
    getOrganization(session.user.organizationId),
  ]);

  return (
    <>
      <PortalShell
        {...patientShellConfig(
          { name: session.user.name, avatarUrl: patient?.photoUrl ?? undefined, role: "Patient" },
          hasUnread,
          notifications,
        )}
      >
        {children}
      </PortalShell>

      {/* Every patient screen, not just the two with a help card. */}
      <HelpFab />

      {/* Rendered only for accounts that have never finished it; the
          component itself is `md:hidden`, so phones only. */}
      {account && account.onboardedAt === null && (
        <PatientOnboarding practiceName={organization?.name ?? "Purity"} />
      )}
    </>
  );
}
