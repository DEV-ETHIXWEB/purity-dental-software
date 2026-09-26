import type { ReactNode } from "react";
import { PortalShell } from "@/components/shell/PortalShell";
import { adminShellConfig } from "@/components/shell/nav-config";
import { requirePortalRole } from "@/lib/auth/require-portal";
import { getOrganization } from "@/lib/data/organization";
import { DEFAULT_CLINIC_TIMEZONE } from "@/lib/datetime";

// Authoritative auth/RBAC gate for the Admin portal. See
// `src/lib/auth/require-portal.ts` for why this DB-backed check exists
// alongside `src/middleware.ts`'s cheaper cookie-presence check.
//
// Every other portal's layout exempts ADMIN from the wrong-role redirect
// (admins hold superset access); here that exemption is the gate itself —
// non-admins are sent back to their own portal.
export default async function AdminPortalLayout({ children }: { children: ReactNode }) {
  const session = await requirePortalRole("ADMIN");
  const organization = await getOrganization(session.user.organizationId);

  return (
    <PortalShell
      {...adminShellConfig(
        {
          name: session.user.name,
          avatarUrl: session.user.avatarUrl ?? undefined,
          role: "Admin",
          presence: session.user.presence,
        },
        organization?.timezone ?? DEFAULT_CLINIC_TIMEZONE,
      )}
    >
      {children}
    </PortalShell>
  );
}
