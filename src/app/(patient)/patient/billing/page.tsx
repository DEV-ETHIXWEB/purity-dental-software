import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PatientBillingView } from "./PatientBillingView";
import { requirePageRole } from "@/lib/auth/require-portal";
import { getPatientForUser } from "@/lib/data/patients";
import { listInvoicesForPatient, patientBillingOverview } from "@/lib/data/billing";

export const metadata: Metadata = {
  title: "Bills",
  description: "Your balance, insurance coverage, invoices and payment history.",
};

export default async function PatientBillingPage() {
  const session = await requirePageRole(["PATIENT"]);
  const patient = await getPatientForUser(session.user.id);
  if (!patient) notFound();

  const [myInvoices, overview] = await Promise.all([
    listInvoicesForPatient(session.user.organizationId, patient.id),
    patientBillingOverview(session.user.organizationId, patient.id),
  ]);
  if (!overview) notFound();

  return (
    <div className="flex flex-col gap-6">
      <div className="animate-rise-in stagger-0">
        <h1 className="text-2xl font-semibold tracking-tight text-text-primary">Bills</h1>
        <p className="text-sm text-text-secondary">
          Manage your payments and insurance in one place.
        </p>
      </div>

      <PatientBillingView initialInvoices={myInvoices} overview={overview} />
    </div>
  );
}
