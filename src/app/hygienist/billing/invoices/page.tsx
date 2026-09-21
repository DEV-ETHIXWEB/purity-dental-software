import type { Metadata } from "next";
import { InvoicesTable } from "@/components/dentist/InvoicesTable";
import { requirePageRole } from "@/lib/auth/require-portal";
import { listInvoices } from "@/lib/data/billing";

export const metadata: Metadata = {
  title: "Invoices",
  description: "Browse, filter, and manage patient invoices.",
};

export default async function HygienistInvoicesPage() {
  const session = await requirePageRole(["HYGIENIST", "ADMIN"]);
  const invoices = await listInvoices(session.user.organizationId);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold text-text-primary">Invoices</h1>
        <p className="text-sm text-text-secondary">{invoices.length} {invoices.length === 1 ? "invoice" : "invoices"} on file.</p>
      </div>

      <InvoicesTable invoices={invoices} basePath="/hygienist" />
    </div>
  );
}
