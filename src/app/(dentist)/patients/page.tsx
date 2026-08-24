import type { Metadata } from "next";
import { UserPlus } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { PatientsTable } from "@/components/dentist/PatientsTable";
import { patients } from "@/lib/sample-data";

export const metadata: Metadata = {
  title: "Patients",
  description: "Search and manage your practice's patient roster.",
};

export default function PatientsPage() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-text-primary">Patients</h1>
          <p className="text-sm text-text-secondary">
            {patients.length} patients in your practice.
          </p>
        </div>
        <Button>
          <UserPlus className="h-4 w-4" aria-hidden="true" />
          Add Patient
        </Button>
      </div>

      <PatientsTable patients={patients} />
    </div>
  );
}
