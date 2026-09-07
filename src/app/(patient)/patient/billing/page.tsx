import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PatientBillingView } from "./PatientBillingView";
import { requireRole } from "@/lib/auth/authorize";
import { getPatientForUser } from "@/lib/data/patients";
import { listInvoicesForPatient } from "@/lib/data/billing";

export const metadata: Metadata = {
  title: "Bills",
  description: "View your invoices and pay your balance.",
};

export default async function PatientBillingPage() {
  const session = await requireRole(["PATIENT"]);
  const patient = await getPatientForUser(session.user.id);
  if (!patient) notFound();

  const myInvoices = await listInvoicesForPatient(session.user.organizationId, patient.id);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold text-text-primary">Bills</h1>
        <p className="text-sm text-text-secondary">
          A simple view of your invoices. No real payment processor is connected yet.
        </p>
      </div>

      <PatientBillingView initialInvoices={myInvoices} />
    </div>
  );
}
