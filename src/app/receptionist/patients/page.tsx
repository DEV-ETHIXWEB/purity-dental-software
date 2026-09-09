import type { Metadata } from "next";
import { ReceptionistPatientsView } from "@/components/receptionist/ReceptionistPatientsView";
import { requirePageRole } from "@/lib/auth/require-portal";
import { listPatients } from "@/lib/data/patients";

export const metadata: Metadata = {
  title: "Patients",
  description: "Search the practice's patient roster and register new patients.",
};

export default async function ReceptionistPatientsPage({
  searchParams,
}: PageProps<"/receptionist/patients">) {
  const session = await requirePageRole(["RECEPTIONIST", "ADMIN"]);
  const patients = await listPatients(session.user.organizationId);
  const { q } = await searchParams;

  return <ReceptionistPatientsView patients={patients} initialQuery={typeof q === "string" ? q : undefined} />;
}
