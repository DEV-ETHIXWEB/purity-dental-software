import type { ReactNode } from "react";
import { PortalShell } from "@/components/shell/PortalShell";
import { dentistShellConfig } from "@/components/shell/nav-config";
import { requirePortalRole } from "@/lib/auth/require-portal";

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
  await requirePortalRole("DENTIST");

  return <PortalShell {...dentistShellConfig}>{children}</PortalShell>;
}
