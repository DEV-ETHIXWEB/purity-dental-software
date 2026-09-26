"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Search } from "lucide-react";
import {
  TableContainer,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableHeaderCell,
  TableCell,
} from "@/components/ui/Table";
import { Avatar } from "@/components/ui/Avatar";
import { cn } from "@/lib/cn";
import { Input } from "@/components/ui/Input";
import { PatientStatusBadge, PATIENT_STATUS_LABEL } from "@/components/dentist/PatientStatusBadge";
import { PatientStatusMenu } from "@/components/dentist/PatientStatusMenu";
import type { PatientStatus } from "@/generated/prisma/client";
import type { AssignedProvider } from "@/lib/data/patients";
import { patientFullName, patientAge } from "@/lib/patient-format";
import type { Patient } from "@/generated/prisma/client";
import { formatClinicDate, formatClinicDateShort } from "@/lib/datetime";
import { useClinicTimeZone } from "@/components/shell/ClinicTimeZone";

export interface PatientsTableProps {
  patients: Patient[];
  /** Portal route prefix for patient profile links (e.g. "/hygienist"). Defaults to the Dentist portal's root. */
  basePath?: string;
  /** Seeds the search box from the top bar's `?q=` — see `TopBar.tsx`'s search form. */
  initialQuery?: string;
  /**
   * Who each patient is currently under, keyed by patient id. Pass it to add
   * an "Assigned to" column — the front desk needs to know whose chair a
   * patient belongs in, where a single clinician looking at their own list
   * does not.
   */
  providers?: Map<string, AssignedProvider>;
}

type StatusFilter = PatientStatus | "ALL";

const FILTERS: StatusFilter[] = ["ACTIVE", "COMPLETED", "INACTIVE", "ALL"];

export function PatientsTable({ patients, basePath = "", initialQuery = "", providers }: PatientsTableProps) {
  const timeZone = useClinicTimeZone();
  const [query, setQuery] = useState(initialQuery);
  /*
   * Defaults to Active, so removing a patient actually removes them from the
   * view staff live in. Completed and Archived are one click away rather than
   * hidden — and every chip carries its count, so nobody has to wonder
   * whether a missing patient was deleted.
   */
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("ACTIVE");

  const counts = useMemo(() => {
    const byStatus: Record<StatusFilter, number> = {
      ACTIVE: 0,
      COMPLETED: 0,
      INACTIVE: 0,
      ALL: patients.length,
    };
    for (const p of patients) byStatus[p.status] += 1;
    return byStatus;
  }, [patients]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return patients.filter((p) => {
      if (statusFilter !== "ALL" && p.status !== statusFilter) return false;
      if (!q) return true;
      return `${patientFullName(p)} ${p.email} ${p.phone}`.toLowerCase().includes(q);
    });
  }, [patients, query, statusFilter]);

  return (
    <div className="flex flex-col gap-4">
      <div className="relative max-w-sm">
        <Search
          className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-secondary"
          aria-hidden="true"
        />
        <Input
          label="Search patients"
          wrapperClassName="gap-1.5 [&>label]:sr-only"
          className="pl-9"
          placeholder="Search by name, email, or phone…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <span className="sr-only" aria-live="polite">
          {filtered.length} {filtered.length === 1 ? "patient" : "patients"} found
        </span>
      </div>

      <div role="tablist" aria-label="Filter patients by status" className="flex flex-wrap gap-1">
        {FILTERS.map((value) => (
          <button
            key={value}
            type="button"
            role="tab"
            aria-selected={statusFilter === value}
            onClick={() => setStatusFilter(value)}
            className={cn(
              // `inline-flex` + a 44px floor on phones: these are hand-rolled
              // tabs rather than `TabsTrigger`, so they miss that component's
              // touch floor.
              "inline-flex items-center justify-center rounded-[var(--radius-md)] px-3 py-1.5 text-xs font-medium transition-colors duration-200 ease-out",
              "min-h-11 sm:min-h-0",
              "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-brand-blue)]",
              statusFilter === value
                ? "bg-surface text-text-primary shadow-card"
                : "text-text-secondary hover:bg-surface-muted hover:text-text-primary",
            )}
          >
            {value === "ALL" ? "All" : PATIENT_STATUS_LABEL[value]} ({counts[value]})
          </button>
        ))}
      </div>

      {/* Desktop / tablet: table. Mobile: stacked cards (same data, no horizontal scroll needed for a short row). */}
      <TableContainer className="hidden sm:block">
        <Table className="min-w-[720px]">
          <TableHead>
            <TableRow>
              <TableHeaderCell>Patient</TableHeaderCell>
              <TableHeaderCell>Age / Sex</TableHeaderCell>
              <TableHeaderCell>Last Visit</TableHeaderCell>
              <TableHeaderCell>Next Visit</TableHeaderCell>
              {providers && <TableHeaderCell>Assigned to</TableHeaderCell>}
              <TableHeaderCell>Status</TableHeaderCell>
              <TableHeaderCell>
                <span className="sr-only">Actions</span>
              </TableHeaderCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filtered.map((p) => (
              <TableRow key={p.id}>
                <TableCell>
                  <Link
                    href={`${basePath}/patients/${p.id}`}
                    className="group/name flex items-center gap-3 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-brand-blue)] rounded-[var(--radius-sm)]"
                  >
                    <Avatar
                      name={patientFullName(p)}
                      src={p.photoUrl}
                      size="sm"
                      className="transition-transform duration-200 ease-out group-hover/name:-translate-y-0.5 motion-reduce:group-hover/name:translate-y-0"
                    />
                    {/* Lifts a couple of pixels on hover — the row already
                        tints, so the name needs a lighter touch than a
                        second background change. */}
                    <span className="font-medium text-text-primary transition-all duration-200 ease-out group-hover/name:-translate-y-0.5 group-hover/name:text-[var(--color-brand-blue-text)] motion-reduce:group-hover/name:translate-y-0">
                      {patientFullName(p)}
                    </span>
                  </Link>
                </TableCell>
                <TableCell className="text-text-secondary">
                  {patientAge(p)} / {p.sex === "MALE" ? "M" : p.sex === "FEMALE" ? "F" : "O"}
                </TableCell>
                <TableCell className="text-text-secondary">
                  {p.lastCleaningAt
                    ? formatClinicDate(new Date(p.lastCleaningAt), timeZone)
                    : "—"}
                </TableCell>
                <TableCell className="text-text-secondary">
                  {p.nextApptAt
                    ? formatClinicDate(new Date(p.nextApptAt), timeZone)
                    : "Not scheduled"}
                </TableCell>
                {providers && (
                  <TableCell className="text-text-secondary">
                    {providers.get(p.id) ? (
                      <span className="flex flex-col">
                        <span className="text-text-primary">{providers.get(p.id)!.name}</span>
                        <span className="text-xs capitalize">
                          {providers.get(p.id)!.role.toLowerCase()}
                        </span>
                      </span>
                    ) : (
                      "Unassigned"
                    )}
                  </TableCell>
                )}
                <TableCell>
                  <PatientStatusBadge status={p.status} />
                </TableCell>
                <TableCell className="w-10">
                  <PatientStatusMenu
                    patientId={p.id}
                    patientName={patientFullName(p)}
                    status={p.status}
                  />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <ul className="flex flex-col gap-3 sm:hidden">
        {filtered.map((p) => (
          <li
            key={p.id}
            className="flex items-start gap-3 rounded-[var(--radius-xl)] border border-border bg-surface p-4 shadow-card"
          >
            {/* The badge sits under the meta line rather than beside it:
                on a 375px screen a name, a badge and a menu button competing
                for one row left the name truncated to a single letter. */}
            <Link
              href={`${basePath}/patients/${p.id}`}
              className="flex min-w-0 flex-1 items-start gap-3 rounded-[var(--radius-sm)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-brand-blue)]"
            >
              <Avatar name={patientFullName(p)} src={p.photoUrl} />
              <span className="min-w-0 flex-1">
                <span className="block truncate font-medium text-text-primary">
                  {patientFullName(p)}
                </span>
                <span className="block truncate text-xs text-text-secondary">
                  {patientAge(p)} yrs · Next: {p.nextApptAt ? formatClinicDateShort(new Date(p.nextApptAt), timeZone) : "Not scheduled"}
                </span>
                {providers && (
                  <span className="block truncate text-xs text-text-secondary">
                    {providers.get(p.id)?.name ?? "Unassigned"}
                  </span>
                )}
                <span className="mt-1.5 block">
                  <PatientStatusBadge status={p.status} />
                </span>
              </span>
            </Link>
            <PatientStatusMenu
              patientId={p.id}
              patientName={patientFullName(p)}
              status={p.status}
            />
          </li>
        ))}
      </ul>

      {filtered.length === 0 && (
        <p className="py-8 text-center text-sm text-text-secondary">
          {query.trim()
            ? `No ${statusFilter === "ALL" ? "" : PATIENT_STATUS_LABEL[statusFilter].toLowerCase() + " "}patients match "${query}".`
            : `No ${statusFilter === "ALL" ? "" : PATIENT_STATUS_LABEL[statusFilter].toLowerCase() + " "}patients yet.`}
        </p>
      )}
    </div>
  );
}
