import type { Metadata } from "next";
import { PatientsTable } from "@/components/dentist/PatientsTable";
import { OverdueRecallsCard } from "@/components/hygienist/OverdueRecallsCard";
import { requireRole } from "@/lib/auth/authorize";
import { listPatients } from "@/lib/data/patients";

export const metadata: Metadata = {
  title: "Patients",
  description: "Search and manage the practice's patient roster.",
};

export default async function HygienistPatientsPage({
  searchParams,
}: PageProps<"/hygienist/patients">) {
  const session = await requireRole(["HYGIENIST", "ADMIN"]);
  const patients = await listPatients(session.user.organizationId);
  const { q } = await searchParams;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold text-text-primary">Patients</h1>
        <p className="text-sm text-text-secondary">
          {patients.length} patients in the practice.
        </p>
      </div>

      <OverdueRecallsCard patients={patients} />

      <PatientsTable patients={patients} basePath="/hygienist" initialQuery={typeof q === "string" ? q : undefined} />
    </div>
  );
}
