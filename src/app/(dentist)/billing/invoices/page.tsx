import type { Metadata } from "next";
import { InvoicesTable } from "@/components/dentist/InvoicesTable";
import { invoices } from "@/lib/sample-data";

export const metadata: Metadata = {
  title: "Invoices",
  description: "Browse, filter, and manage patient invoices.",
};

export default function InvoicesPage() {
  const sorted = [...invoices].sort((a, b) => b.issuedAt.localeCompare(a.issuedAt));

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold text-text-primary">Invoices</h1>
        <p className="text-sm text-text-secondary">{invoices.length} invoices on file.</p>
      </div>

      <InvoicesTable invoices={sorted} />
    </div>
  );
}
