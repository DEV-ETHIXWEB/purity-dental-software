"use client";

import { createContext, useContext, type ReactNode } from "react";

/**
 * The practice's timezone, made available to every Client Component inside a
 * portal shell.
 *
 * Why context rather than props: roughly twenty leaf components render an
 * appointment time or a record date, and threading `timeZone` through each of
 * their parents would touch far more code than it explains. Server Components
 * can't read context, so the handful that format dates take `timeZone` as an
 * explicit prop from the page that already resolved the organization.
 *
 * The provider lives in `PortalShell`, which wraps `{children}` — context
 * flows into the rendered tree, so Client Components nested inside
 * server-rendered children still see it.
 */
const ClinicTimeZoneContext = createContext<string | null>(null);

export function ClinicTimeZoneProvider({
  timeZone,
  children,
}: {
  timeZone: string;
  children: ReactNode;
}) {
  return <ClinicTimeZoneContext.Provider value={timeZone}>{children}</ClinicTimeZoneContext.Provider>;
}

/**
 * The practice timezone for the surrounding portal.
 *
 * Falls back to the viewer's own zone rather than throwing: a missing provider
 * should degrade to today's (wrong-but-working) behaviour, not blank the page
 * for a clinician mid-shift.
 */
export function useClinicTimeZone(): string {
  const timeZone = useContext(ClinicTimeZoneContext);
  if (timeZone) return timeZone;
  return Intl.DateTimeFormat().resolvedOptions().timeZone;
}
