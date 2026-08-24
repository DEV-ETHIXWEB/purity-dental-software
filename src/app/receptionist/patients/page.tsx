import type { Metadata } from "next";
import { ReceptionistPatientsView } from "@/components/receptionist/ReceptionistPatientsView";

export const metadata: Metadata = {
  title: "Patients",
  description: "Search the practice's patient roster and register new patients.",
};

export default function ReceptionistPatientsPage() {
  return <ReceptionistPatientsView />;
}
