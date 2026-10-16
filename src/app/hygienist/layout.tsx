import type { ReactNode } from "react";
import { PortalShell } from "@/components/shell/PortalShell";
import { PermissionsProvider } from "@/components/auth/Permissions";
import { hygienistShellConfig } from "@/components/shell/nav-config";
import { requirePortalRole } from "@/lib/auth/require-portal";
import { permissionListFor } from "@/lib/auth/permissions";
import { listConversations } from "@/lib/data/messaging";
import { staffNotifications } from "@/lib/data/notifications";
import { getOrganization } from "@/lib/data/organization";
import { DEFAULT_CLINIC_TIMEZONE } from "@/lib/datetime";

// Authoritative auth/RBAC gate for the Hygienist portal. See
// `src/lib/auth/require-portal.ts` for why this DB-backed check exists
// alongside `src/middleware.ts`'s cheaper cookie-presence check.
export default async function HygienistPortalLayout({
  children,
}: {
  children: ReactNode;
}) {
  const session = await requirePortalRole("HYGIENIST");
  const [conversations, notifications, organization] = await Promise.all([
    listConversations(session.user.organizationId),
    staffNotifications(session.user.organizationId, {
      messagesHref: "/hygienist/messages",
      patientsHref: "/hygienist/patients",
      billingHref: "/hygienist/billing",
    }),
    getOrganization(session.user.organizationId),
  ]);
  const hasUnread = conversations.some((c) => c.unreadCount > 0);

  return (
    /*
     * What this viewer may do, for the Client Components that render
     * the controls. Here rather than inside `PortalShell` because the
     * patient portal shares that shell and holds no staff permissions.
     */
    <PermissionsProvider permissions={permissionListFor(session.user)}>
      <PortalShell
        {...hygienistShellConfig(
          { name: session.user.name, avatarUrl: session.user.avatarUrl ?? undefined, role: "Hygienist", presence: session.user.presence },
          organization?.timezone ?? DEFAULT_CLINIC_TIMEZONE,
          hasUnread,
          notifications,
        )}
      >
        {children}
      </PortalShell>
    </PermissionsProvider>
  );
}
