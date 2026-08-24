import type { Metadata } from "next";
import { PatientBillingView } from "./PatientBillingView";
import { currentPatient, invoices } from "@/lib/sample-data";

export const metadata: Metadata = {
  title: "Bills",
  description: "View your invoices and pay your balance.",
};

export default function PatientBillingPage() {
  const myInvoices = invoices
    .filter((i) => i.patientId === currentPatient.id)
    .sort((a, b) => b.issuedAt.localeCompare(a.issuedAt));

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold text-text-primary">Bills</h1>
        <p className="text-sm text-text-secondary">
          A simple view of your invoices. &ldquo;Pay balance&rdquo; here is a demo — no real payment is processed.
        </p>
      </div>

      <PatientBillingView initialInvoices={myInvoices} />
    </div>
  );
}
