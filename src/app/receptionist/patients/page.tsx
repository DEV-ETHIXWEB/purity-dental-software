import type { Metadata } from "next";
import { ReceptionistPatientsView } from "@/components/receptionist/ReceptionistPatientsView";
import { requireRole } from "@/lib/auth/authorize";
import { listPatients } from "@/lib/data/patients";

export const metadata: Metadata = {
  title: "Patients",
  description: "Search the practice's patient roster and register new patients.",
};

export default async function ReceptionistPatientsPage({
  searchParams,
}: PageProps<"/receptionist/patients">) {
  const session = await requireRole(["RECEPTIONIST", "ADMIN"]);
  const patients = await listPatients(session.user.organizationId);
  const { q } = await searchParams;

  return <ReceptionistPatientsView patients={patients} initialQuery={typeof q === "string" ? q : undefined} />;
}
