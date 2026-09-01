import type { ReactNode } from "react";
import { PortalShell } from "@/components/shell/PortalShell";
import { hygienistShellConfig } from "@/components/shell/nav-config";
import { requirePortalRole } from "@/lib/auth/require-portal";

// Authoritative auth/RBAC gate for the Hygienist portal. See
// `src/lib/auth/require-portal.ts` for why this DB-backed check exists
// alongside `src/middleware.ts`'s cheaper cookie-presence check.
export default async function HygienistPortalLayout({
  children,
}: {
  children: ReactNode;
}) {
  await requirePortalRole("HYGIENIST");

  return <PortalShell {...hygienistShellConfig}>{children}</PortalShell>;
}
