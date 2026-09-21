import type { ReactNode } from "react";
import { PortalShell } from "@/components/shell/PortalShell";
import { hygienistShellConfig } from "@/components/shell/nav-config";
import { requirePortalRole } from "@/lib/auth/require-portal";
import { listConversations } from "@/lib/data/messaging";
import { staffNotifications } from "@/lib/data/notifications";

// Authoritative auth/RBAC gate for the Hygienist portal. See
// `src/lib/auth/require-portal.ts` for why this DB-backed check exists
// alongside `src/middleware.ts`'s cheaper cookie-presence check.
export default async function HygienistPortalLayout({
  children,
}: {
  children: ReactNode;
}) {
  const session = await requirePortalRole("HYGIENIST");
  const [conversations, notifications] = await Promise.all([
    listConversations(session.user.organizationId),
    staffNotifications(session.user.organizationId, {
      messagesHref: "/hygienist/messages",
      patientsHref: "/hygienist/patients",
      billingHref: "/hygienist/billing",
    }),
  ]);
  const hasUnread = conversations.some((c) => c.unreadCount > 0);

  return (
    <PortalShell
      {...hygienistShellConfig(
        { name: session.user.name, avatarUrl: session.user.avatarUrl ?? undefined, role: "Hygienist" },
        hasUnread,
        notifications,
      )}
    >
      {children}
    </PortalShell>
  );
}
