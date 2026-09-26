import type { ReactNode } from "react";
import { PortalShell } from "@/components/shell/PortalShell";
import { receptionistShellConfig } from "@/components/shell/nav-config";
import { requirePortalRole } from "@/lib/auth/require-portal";
import { listFollowUps } from "@/lib/data/patients";
import { staffNotifications } from "@/lib/data/notifications";
import { getOrganization } from "@/lib/data/organization";
import { DEFAULT_CLINIC_TIMEZONE } from "@/lib/datetime";

// Authoritative auth/RBAC gate for the Receptionist portal. See
// `src/lib/auth/require-portal.ts` for why this DB-backed check exists
// alongside `src/middleware.ts`'s cheaper cookie-presence check.
export default async function ReceptionistPortalLayout({
  children,
}: {
  children: ReactNode;
}) {
  const session = await requirePortalRole("RECEPTIONIST");
  const [followUps, notifications, organization] = await Promise.all([
    listFollowUps(session.user.organizationId, 1),
    staffNotifications(session.user.organizationId, {
      patientsHref: "/receptionist/patients",
      billingHref: "/receptionist/billing",
    }),
    getOrganization(session.user.organizationId),
  ]);

  return (
    <PortalShell
      {...receptionistShellConfig(
        { name: session.user.name, avatarUrl: session.user.avatarUrl ?? undefined, role: "Receptionist", presence: session.user.presence },
        organization?.timezone ?? DEFAULT_CLINIC_TIMEZONE,
        followUps.length > 0 || notifications.some((n) => n.unread),
        notifications,
      )}
    >
      {children}
    </PortalShell>
  );
}
