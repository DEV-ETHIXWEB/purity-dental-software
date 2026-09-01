import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { PatientRegistrationForm } from "@/components/receptionist/PatientRegistrationForm";

export const metadata: Metadata = {
  title: "Register Patient",
  description: "Register a new patient with contact, demographic, and insurance details.",
};

export default function RegisterPatientPage() {
  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6">
      <div>
        <Link
          href="/receptionist/patients"
          className="mb-3 inline-flex items-center gap-1.5 text-sm font-medium text-text-secondary hover:text-text-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-brand-blue)] rounded-[var(--radius-sm)]"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Back to Patients
        </Link>
        <h1 className="text-2xl font-semibold text-text-primary">Register Patient</h1>
        <p className="text-sm text-text-secondary">
          Enter the new patient&apos;s demographic, contact, and insurance information.
        </p>
      </div>

      <PatientRegistrationForm />
    </div>
  );
}
