"use client";

import { createContext, useContext, useMemo, type ReactNode } from "react";
import type { PermissionKey } from "@/lib/auth/permissions";

/**
 * The viewer's effective permissions, made available to every Client
 * Component inside a staff portal shell.
 *
 * Why this exists: the Server Actions behind every staff control are gated
 * on a permission, but the controls themselves were not. Revoking
 * "Record payments" from a hygienist left the mark-paid button exactly where
 * it was — it just started refusing every click. A permission someone
 * doesn't hold should take the control away, not turn it into a trap.
 *
 * Why context rather than props, and the same reasoning as
 * `ClinicTimeZoneProvider`: the controls are leaves (a button inside a table
 * inside a panel inside a page), and threading a `can` prop down to each of
 * them would touch far more code than it explains. Server Components can't
 * read context, so the pages call `hasPermission(session.user, …)` directly.
 *
 * Provided by each staff portal's `layout.tsx` rather than by `PortalShell`:
 * the patient portal uses the same shell and holds none of these
 * permissions, so there is nothing for it to provide.
 */
const PermissionsContext = createContext<readonly PermissionKey[] | null>(null);

export function PermissionsProvider({
  permissions,
  children,
}: {
  /**
   * An array rather than the `Set` that `effectivePermissions` returns: this
   * crosses the server/client boundary, and a Set is not serializable.
   */
  permissions: readonly PermissionKey[];
  children: ReactNode;
}) {
  return <PermissionsContext.Provider value={permissions}>{children}</PermissionsContext.Provider>;
}

/**
 * Whether the viewer holds a permission.
 *
 * With no provider above it this answers `false` for everything, which
 * renders the portal as if nothing were permitted. That is the safe
 * direction — it hides controls rather than offering ones the server will
 * refuse — and it is loud enough to spot immediately, unlike a default that
 * silently granted access.
 */
export function useCan(): (permission: PermissionKey) => boolean {
  const permissions = useContext(PermissionsContext);

  return useMemo(() => {
    const held = new Set(permissions ?? []);
    return (permission: PermissionKey) => held.has(permission);
  }, [permissions]);
}
