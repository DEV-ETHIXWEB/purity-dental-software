import type { ReactNode } from "react";
import { PortalShell } from "@/components/shell/PortalShell";
import { receptionistShellConfig } from "@/components/shell/nav-config";
import { requirePortalRole } from "@/lib/auth/require-portal";

// Authoritative auth/RBAC gate for the Receptionist portal. See
// `src/lib/auth/require-portal.ts` for why this DB-backed check exists
// alongside `src/middleware.ts`'s cheaper cookie-presence check.
export default async function ReceptionistPortalLayout({
  children,
}: {
  children: ReactNode;
}) {
  await requirePortalRole("RECEPTIONIST");

  return <PortalShell {...receptionistShellConfig}>{children}</PortalShell>;
}
