import type { Metadata } from "next";
import { Card, CardContent } from "@/components/ui/Card";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { requirePageRole } from "@/lib/auth/require-portal";
import { listAuditEntries, auditActors, auditEntryCount, AUDIT_PAGE_SIZE } from "@/lib/data/audit";
import { clinicTimeZone } from "@/lib/data/organization";
import { formatClinicDateTime } from "@/lib/datetime";
import { describeAuditAction } from "@/lib/audit-format";
import { AuditFilters } from "@/components/admin/AuditFilters";

export const metadata: Metadata = {
  title: "Activity",
  description: "A record of what staff changed and when.",
};

export default async function AdminAuditPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; actor?: string; take?: string }>;
}) {
  const session = await requirePageRole(["ADMIN"]);
  const organizationId = session.user.organizationId;
  const { q, actor, take } = await searchParams;

  const requested = Number.parseInt(take ?? "", 10);
  const limit = Number.isFinite(requested) ? Math.min(Math.max(requested, 10), 250) : AUDIT_PAGE_SIZE;

  const [entries, actors, total, timeZone] = await Promise.all([
    listAuditEntries(organizationId, { search: q, actorUserId: actor, take: limit }),
    auditActors(organizationId),
    auditEntryCount(organizationId),
    clinicTimeZone(organizationId),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold text-text-primary">Activity</h1>
        <p className="text-sm text-text-secondary">
          Every recorded change in this practice — {total.toLocaleString()} in total.
        </p>
      </div>

      <AuditFilters actors={actors} initialQuery={q ?? ""} initialActor={actor ?? ""} />

      <Card>
        <CardContent className="p-0">
          {entries.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-sm font-medium text-text-primary">No activity matches</p>
              <p className="mt-1 text-xs text-text-secondary">
                {total === 0
                  ? "Nothing has been recorded for this practice yet."
                  : "Try a different search or actor."}
              </p>
            </div>
          ) : (
            <ul className="divide-y divide-border">
              {entries.map((entry) => (
                <li key={entry.id} className="flex items-start gap-3 p-4">
                  <Avatar name={entry.actor?.name ?? "System"} size="sm" className="mt-0.5" />
                  <div className="min-w-0 flex-1">
                    <p className="flex flex-wrap items-center gap-2 text-sm text-text-primary">
                      <span className="font-medium">{entry.actor?.name ?? "System"}</span>
                      <span className="text-text-secondary">{describeAuditAction(entry.action)}</span>
                    </p>
                    <p className="mt-0.5 flex flex-wrap items-center gap-2 text-xs text-text-secondary">
                      <Badge tone="neutral">{entry.resourceType}</Badge>
                      <span className="font-mono">{entry.resourceId}</span>
                      <span>· {formatClinicDateTime(entry.createdAt, timeZone)}</span>
                    </p>
                    {entry.metadata != null && (
                      /*
                       * Raw metadata, deliberately. Each action writes its own
                       * shape (a from/to pair, a permission key, a provider
                       * swap), and a per-action renderer would be a second
                       * place to keep in sync with every new audit call. The
                       * whole point of this page is the detail.
                       */
                      <pre className="mt-1.5 overflow-x-auto rounded-[var(--radius-sm)] bg-surface-sunken px-2 py-1.5 text-[11px] text-text-secondary">
                        {JSON.stringify(entry.metadata)}
                      </pre>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      {entries.length >= limit && (
        <p className="text-center text-sm text-text-secondary">
          Showing the {limit} most recent.{" "}
          <a
            href={`?${new URLSearchParams({
              ...(q ? { q } : {}),
              ...(actor ? { actor } : {}),
              take: String(Math.min(limit * 2, 250)),
            })}`}
            className="touch-link text-[var(--color-brand-blue-text)] hover:underline"
          >
            Show more
          </a>
        </p>
      )}
    </div>
  );
}
