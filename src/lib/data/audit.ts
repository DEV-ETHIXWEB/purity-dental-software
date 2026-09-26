import "server-only";
import { prisma } from "@/lib/prisma";
import type { Prisma } from "@/generated/prisma/client";

/** Audit-log reads for the Admin portal's activity view. */

export interface AuditEntry {
  id: string;
  action: string;
  resourceType: string;
  resourceId: string;
  metadata: Prisma.JsonValue | null;
  createdAt: Date;
  actor: { id: string; name: string; role: string } | null;
}

export interface AuditQuery {
  /** Substring match on the action key, e.g. "appointment" or "messaging". */
  search?: string;
  /** Restrict to one actor. */
  actorUserId?: string;
  /** How many rows to return. The view pages rather than streaming everything. */
  take?: number;
}

export const AUDIT_PAGE_SIZE = 50;

/**
 * Recent audit rows, newest first.
 *
 * The app has been writing these all along — appointment moves, patient
 * status changes, messaging grants — with nothing in the product to read
 * them back. This is the read side.
 *
 * Deliberately not paginated by cursor: an admin scanning activity wants
 * "the last N, filtered", and a bounded `take` keeps one practice's log from
 * becoming an unbounded query. Raise the limit from the UI rather than
 * walking pages.
 */
export async function listAuditEntries(
  organizationId: string,
  query: AuditQuery = {},
): Promise<AuditEntry[]> {
  const take = Math.min(query.take ?? AUDIT_PAGE_SIZE, 250);

  const rows = await prisma.auditLog.findMany({
    where: {
      organizationId,
      ...(query.actorUserId ? { actorUserId: query.actorUserId } : {}),
      ...(query.search
        ? {
            OR: [
              { action: { contains: query.search, mode: "insensitive" } },
              { resourceType: { contains: query.search, mode: "insensitive" } },
            ],
          }
        : {}),
    },
    orderBy: { createdAt: "desc" },
    take,
    select: {
      id: true,
      action: true,
      resourceType: true,
      resourceId: true,
      metadata: true,
      createdAt: true,
      // Explicit select: `actor` is a full User row, passwordHash included.
      actor: { select: { id: true, name: true, role: true } },
    },
  });

  return rows.map((row) => ({
    ...row,
    actor: row.actor ? { id: row.actor.id, name: row.actor.name, role: row.actor.role } : null,
  }));
}

/** Distinct actors who appear in the log, for the filter dropdown. */
export async function auditActors(
  organizationId: string,
): Promise<{ id: string; name: string }[]> {
  const rows = await prisma.auditLog.findMany({
    where: { organizationId, actorUserId: { not: null } },
    distinct: ["actorUserId"],
    select: { actor: { select: { id: true, name: true } } },
    orderBy: { actorUserId: "asc" },
  });
  return rows
    .map((r) => r.actor)
    .filter((a): a is { id: string; name: string } => a !== null)
    .sort((a, b) => a.name.localeCompare(b.name));
}

/** Total rows in this practice's log, so the view can say what it isn't showing. */
export async function auditEntryCount(organizationId: string): Promise<number> {
  return prisma.auditLog.count({ where: { organizationId } });
}
