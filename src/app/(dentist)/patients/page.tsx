import type { Metadata } from "next";
import { PatientsTable } from "@/components/dentist/PatientsTable";
import { requirePageRole } from "@/lib/auth/require-portal";
import { listPatients } from "@/lib/data/patients";

export const metadata: Metadata = {
  title: "Patients",
  description: "Search and manage your practice's patient roster.",
};

export default async function PatientsPage({
  searchParams,
}: PageProps<"/patients">) {
  const session = await requirePageRole(["DENTIST", "ADMIN"]);
  const patients = await listPatients(session.user.organizationId);
  const { q } = await searchParams;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold text-text-primary">Patients</h1>
        <p className="text-sm text-text-secondary">
          {patients.length} {patients.length === 1 ? "patient" : "patients"} in your practice.
        </p>
      </div>

      <PatientsTable patients={patients} initialQuery={typeof q === "string" ? q : undefined} />
    </div>
  );
}
