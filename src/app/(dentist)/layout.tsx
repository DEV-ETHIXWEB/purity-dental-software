import type { ReactNode } from "react";
import { PortalShell } from "@/components/shell/PortalShell";
import { dentistShellConfig } from "@/components/shell/nav-config";
import { requirePortalRole } from "@/lib/auth/require-portal";
import { listFollowUps } from "@/lib/data/patients";
import { staffNotifications } from "@/lib/data/notifications";

// Authoritative auth/RBAC gate for the Dentist portal (root-level route
// group). `src/middleware.ts` already redirects unauthenticated requests
// to `/login` before this layout even runs; this call re-verifies the
// session against the database (role, expiry, isActive) and redirects an
// authenticated-but-wrong-role visitor to their own portal's dashboard —
// see `src/lib/auth/require-portal.ts` for why both layers exist.
export default async function DentistPortalLayout({
  children,
}: {
  children: ReactNode;
}) {
  const session = await requirePortalRole("DENTIST");
  const [followUps, notifications] = await Promise.all([
    listFollowUps(session.user.organizationId, 1),
    staffNotifications(session.user.organizationId, {
      patientsHref: "/patients",
      billingHref: "/billing",
    }),
  ]);

  return (
    <PortalShell
      {...dentistShellConfig(
        { name: session.user.name, avatarUrl: session.user.avatarUrl ?? undefined, role: "Dentist" },
        followUps.length > 0 || notifications.some((n) => n.unread),
        notifications,
      )}
    >
      {children}
    </PortalShell>
  );
}
