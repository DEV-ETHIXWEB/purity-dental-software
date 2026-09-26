"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Avatar } from "@/components/ui/Avatar";
import { Badge, type BadgeTone } from "@/components/ui/Badge";
import { Input } from "@/components/ui/Input";
import {
  TableContainer,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableHeaderCell,
  TableCell,
} from "@/components/ui/Table";
import { ROLE_LABELS, type StaffMember } from "@/lib/staff-format";
import { effectivePermissions, defaultPermissionsForRole } from "@/lib/auth/permissions";
import type { UserRole } from "@/generated/prisma/client";
import { cn } from "@/lib/cn";

const ROLE_TONE: Record<UserRole, BadgeTone> = {
  ADMIN: "brand-blue",
  DENTIST: "info",
  HYGIENIST: "brand-teal",
  RECEPTIONIST: "neutral",
  PATIENT: "neutral",
};

/**
 * How many permissions this person holds that differ from their role's
 * defaults — surfaced in the list so an admin can see at a glance who has
 * been given exceptions without opening every record.
 */
function overrideCount(member: StaffMember): number {
  const effective = effectivePermissions(member.role, member.permissionOverrides);
  const defaults = new Set(defaultPermissionsForRole(member.role));
  let count = 0;
  for (const key of effective) if (!defaults.has(key)) count += 1;
  for (const key of defaults) if (!effective.has(key)) count += 1;
  return count;
}

export function StaffTable({
  staff,
  initialQuery = "",
}: {
  staff: StaffMember[];
  /** Seeded from `?q=` so the top bar's search lands on a filtered list. */
  initialQuery?: string;
}) {
  const [query, setQuery] = useState(initialQuery);
  const [showInactive, setShowInactive] = useState(false);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return staff.filter((member) => {
      if (!showInactive && !member.isActive) return false;
      if (!q) return true;
      return (
        member.name.toLowerCase().includes(q) ||
        member.email.toLowerCase().includes(q) ||
        ROLE_LABELS[member.role].toLowerCase().includes(q)
      );
    });
  }, [staff, query, showInactive]);

  const inactiveCount = staff.filter((m) => !m.isActive).length;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search staff by name, email or role…"
          aria-label="Search staff"
          className="sm:max-w-sm"
        />
        {inactiveCount > 0 && (
          <label className="flex cursor-pointer items-center gap-2 text-sm text-text-secondary">
            <input
              type="checkbox"
              checked={showInactive}
              onChange={(e) => setShowInactive(e.target.checked)}
              className="h-4 w-4 cursor-pointer accent-[var(--color-brand-blue)]"
            />
            Show deactivated ({inactiveCount})
          </label>
        )}
      </div>

      <p className="text-sm text-text-secondary" aria-live="polite">
        {filtered.length} {filtered.length === 1 ? "person" : "people"}
      </p>

      {/* Desktop table */}
      <TableContainer className="hidden md:block">
        <Table>
          <TableHead>
            <TableRow>
              <TableHeaderCell>Name</TableHeaderCell>
              <TableHeaderCell>Role</TableHeaderCell>
              <TableHeaderCell>Email</TableHeaderCell>
              <TableHeaderCell>Permissions</TableHeaderCell>
              <TableHeaderCell>Status</TableHeaderCell>
            </TableRow>
          </TableHead>
          <TableBody className="divide-y divide-border">
            {filtered.map((member) => {
              const overrides = overrideCount(member);
              return (
                <TableRow key={member.id}>
                  <TableCell>
                    <Link
                      href={`/admin/staff/${member.id}`}
                      className="group/name flex min-w-0 items-center gap-3 rounded-[var(--radius-sm)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-brand-blue)]"
                    >
                      <Avatar
                        name={member.name}
                        src={member.avatarUrl}
                        size="sm"
                        className={cn(
                          "transition-transform duration-200 ease-out group-hover/name:scale-105",
                          !member.isActive && "opacity-60",
                        )}
                      />
                      <span className="min-w-0 truncate text-sm font-medium text-text-primary group-hover/name:text-[var(--color-brand-blue-text)]">
                        {member.name}
                      </span>
                    </Link>
                  </TableCell>
                  <TableCell>
                    <Badge tone={ROLE_TONE[member.role]}>{ROLE_LABELS[member.role]}</Badge>
                  </TableCell>
                  <TableCell className="text-text-secondary">{member.email}</TableCell>
                  <TableCell className="text-text-secondary">
                    {overrides === 0 ? (
                      <span className="text-xs">Role defaults</span>
                    ) : (
                      <span className="text-xs font-medium text-[var(--color-brand-blue-text)]">
                        {overrides} {overrides === 1 ? "exception" : "exceptions"}
                      </span>
                    )}
                  </TableCell>
                  <TableCell>
                    {member.isActive ? (
                      <Badge tone="success">Active</Badge>
                    ) : (
                      <Badge tone="neutral">Deactivated</Badge>
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Mobile cards */}
      <ul className="flex flex-col gap-3 md:hidden">
        {filtered.map((member) => {
          const overrides = overrideCount(member);
          return (
            <li key={member.id}>
              <Link
                href={`/admin/staff/${member.id}`}
                className="flex min-w-0 items-center gap-3 rounded-[var(--radius-lg)] border border-border bg-surface p-3 shadow-card transition-shadow duration-200 ease-out hover:shadow-card-hover focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-brand-blue)]"
              >
                <Avatar
                  name={member.name}
                  src={member.avatarUrl}
                  className={cn(!member.isActive && "opacity-60")}
                />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium text-text-primary">
                    {member.name}
                  </span>
                  <span className="block truncate text-xs text-text-secondary">{member.email}</span>
                  {overrides > 0 && (
                    <span className="mt-0.5 block text-xs text-[var(--color-brand-blue-text)]">
                      {overrides} permission {overrides === 1 ? "exception" : "exceptions"}
                    </span>
                  )}
                </span>
                <span className="flex shrink-0 flex-col items-end gap-1">
                  <Badge tone={ROLE_TONE[member.role]}>{ROLE_LABELS[member.role]}</Badge>
                  {!member.isActive && <Badge tone="neutral">Deactivated</Badge>}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>

      {filtered.length === 0 && (
        <div className="rounded-[var(--radius-lg)] border border-dashed border-border-strong p-8 text-center">
          <p className="text-sm font-medium text-text-primary">No staff match that search</p>
          <p className="mt-1 text-xs text-text-secondary">Try a different name, email or role.</p>
        </div>
      )}
    </div>
  );
}
