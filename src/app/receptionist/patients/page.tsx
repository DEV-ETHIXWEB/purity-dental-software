import type { Metadata } from "next";
import { ReceptionistPatientsView } from "@/components/receptionist/ReceptionistPatientsView";
import { requirePageRole } from "@/lib/auth/require-portal";
import { assignedProviders, listPatients } from "@/lib/data/patients";

export const metadata: Metadata = {
  title: "Patients",
  description: "Search the practice's patient roster and register new patients.",
};

export default async function ReceptionistPatientsPage({
  searchParams,
}: PageProps<"/receptionist/patients">) {
  const session = await requirePageRole(["RECEPTIONIST", "ADMIN"]);
  const patients = await listPatients(session.user.organizationId);
  const [providers, { q }] = await Promise.all([
    assignedProviders(
      session.user.organizationId,
      patients.map((p) => p.id),
    ),
    searchParams,
  ]);

  return (
    <ReceptionistPatientsView
      patients={patients}
      initialQuery={typeof q === "string" ? q : undefined}
      providers={providers}
    />
  );
}
