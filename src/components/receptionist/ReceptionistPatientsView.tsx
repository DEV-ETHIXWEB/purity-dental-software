"use client";

import Link from "next/link";
import { UserPlus } from "lucide-react";
import { PatientsTable } from "@/components/dentist/PatientsTable";
import { useAllPatients } from "@/lib/receptionist-patients-store";

export function ReceptionistPatientsView() {
  const patients = useAllPatients();

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-text-primary">Patients</h1>
          <p className="text-sm text-text-secondary">
            {patients.length} patients in the practice.
          </p>
        </div>
        <Link
          href="/receptionist/patients/new"
          className="brand-gradient-bg inline-flex h-10 items-center gap-2 rounded-[var(--radius-lg)] px-4 text-sm font-medium text-white shadow-card transition-opacity hover:opacity-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-brand-blue)]"
        >
          <UserPlus className="h-4 w-4" aria-hidden="true" />
          Register Patient
        </Link>
      </div>

      <PatientsTable patients={patients} basePath="/receptionist" />
    </div>
  );
}
