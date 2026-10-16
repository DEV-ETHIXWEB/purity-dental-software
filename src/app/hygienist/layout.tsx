import type { ReactNode } from "react";
import { PortalShell } from "@/components/shell/PortalShell";
import { PermissionsProvider } from "@/components/auth/Permissions";
import { hygienistShellConfig } from "@/components/shell/nav-config";
import { requirePortalRole } from "@/lib/auth/require-portal";
import { hasPermission, permissionListFor } from "@/lib/auth/permissions";
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
  /*
   * The notification feed links into Messages and Billing, both of which
   * are permission-gated pages that bounce a viewer without the grant. So
   * a route is only offered to someone who can follow it — which also keeps
   * "new message" and "overdue invoice" rows, and what they reveal, out of
   * the feed of someone who may not see those areas at all.
   */
  const canMessage = hasPermission(session.user, "messaging.reply");
  const canSeeBilling = hasPermission(session.user, "billing.view");
  const [conversations, notifications, organization] = await Promise.all([
    listConversations(session.user.organizationId),
    staffNotifications(session.user.organizationId, {
      messagesHref: canMessage ? "/hygienist/messages" : undefined,
      patientsHref: "/hygienist/patients",
      billingHref: canSeeBilling ? "/hygienist/billing" : undefined,
    }),
    getOrganization(session.user.organizationId),
  ]);
  const hasUnread = canMessage && conversations.some((c) => c.unreadCount > 0);

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
        // The bell's "view all" target; undefined falls back to Patients.
        messagesHref={canMessage ? "/hygienist/messages" : undefined}
      >
        {children}
      </PortalShell>
    </PermissionsProvider>
  );
}
