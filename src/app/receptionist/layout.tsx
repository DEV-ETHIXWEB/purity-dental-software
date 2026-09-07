import type { ReactNode } from "react";
import { PortalShell } from "@/components/shell/PortalShell";
import { receptionistShellConfig } from "@/components/shell/nav-config";
import { requirePortalRole } from "@/lib/auth/require-portal";
import { listFollowUps } from "@/lib/data/patients";

// Authoritative auth/RBAC gate for the Receptionist portal. See
// `src/lib/auth/require-portal.ts` for why this DB-backed check exists
// alongside `src/middleware.ts`'s cheaper cookie-presence check.
export default async function ReceptionistPortalLayout({
  children,
}: {
  children: ReactNode;
}) {
  const session = await requirePortalRole("RECEPTIONIST");
  const followUps = await listFollowUps(session.user.organizationId, 1);

  return (
    <PortalShell
      {...receptionistShellConfig(
        { name: session.user.name, avatarUrl: session.user.avatarUrl ?? undefined, role: "Receptionist" },
        followUps.length > 0,
      )}
    >
      {children}
    </PortalShell>
  );
}
