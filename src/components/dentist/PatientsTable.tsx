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
import { Input } from "@/components/ui/Input";
import { PatientStatusBadge } from "@/components/dentist/PatientStatusBadge";
import { patientFullName, patientAge } from "@/lib/patient-format";
import type { Patient } from "@/generated/prisma/client";

export interface PatientsTableProps {
  patients: Patient[];
  /** Portal route prefix for patient profile links (e.g. "/hygienist"). Defaults to the Dentist portal's root. */
  basePath?: string;
  /** Seeds the search box from the top bar's `?q=` — see `TopBar.tsx`'s search form. */
  initialQuery?: string;
}

export function PatientsTable({ patients, basePath = "", initialQuery = "" }: PatientsTableProps) {
  const [query, setQuery] = useState(initialQuery);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return patients;
    return patients.filter((p) =>
      `${patientFullName(p)} ${p.email} ${p.phone}`.toLowerCase().includes(q),
    );
  }, [patients, query]);

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
          {filtered.length} patients found
        </span>
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
              <TableHeaderCell>Status</TableHeaderCell>
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
                    ? new Date(p.lastCleaningAt).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })
                    : "—"}
                </TableCell>
                <TableCell className="text-text-secondary">
                  {p.nextApptAt
                    ? new Date(p.nextApptAt).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })
                    : "Not scheduled"}
                </TableCell>
                <TableCell>
                  <PatientStatusBadge status={p.status} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <ul className="flex flex-col gap-3 sm:hidden">
        {filtered.map((p) => (
          <li key={p.id}>
            <Link
              href={`${basePath}/patients/${p.id}`}
              className="flex items-center gap-3 rounded-[var(--radius-xl)] border border-border bg-surface p-4 shadow-card focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-brand-blue)]"
            >
              <Avatar name={patientFullName(p)} src={p.photoUrl} />
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium text-text-primary">{patientFullName(p)}</p>
                <p className="text-xs text-text-secondary">
                  {patientAge(p)} yrs · Next: {p.nextApptAt ? new Date(p.nextApptAt).toLocaleDateString("en-US", { month: "short", day: "numeric" }) : "Not scheduled"}
                </p>
              </div>
              <PatientStatusBadge status={p.status} />
            </Link>
          </li>
        ))}
      </ul>

      {filtered.length === 0 && (
        <p className="py-8 text-center text-sm text-text-secondary">
          No patients match &quot;{query}&quot;.
        </p>
      )}
    </div>
  );
}
