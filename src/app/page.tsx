import { redirect } from "next/navigation";
import { getCurrentSession, dashboardPathForRole } from "@/lib/auth/session";

/**
 * Root path: resolve the visitor's session server-side and route them to
 * their own portal's dashboard, or to `/login` if unauthenticated. This
 * replaces the old hardcoded `/dashboard` redirect now that real
 * session-based auth exists — see `src/middleware.ts` for the route-group
 * gate that also protects `/dashboard` etc. directly.
 */
export default async function RootPage() {
  const session = await getCurrentSession();
  if (!session) {
    redirect("/login");
  }
  redirect(dashboardPathForRole(session.user.role));
}
