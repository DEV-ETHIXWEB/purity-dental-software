import type { ReactNode } from "react";
import { requireRole } from "@/lib/auth/authorize";
import { listInvoices } from "@/lib/data/billing";
import { listPatients } from "@/lib/data/patients";
import { InvoicesListPanel } from "@/components/dentist/InvoicesListPanel";

export const metadata = {
  title: "Invoices",
  description: "Browse, filter, and manage patient invoices.",
};

/**
 * Master-detail shell for /billing/invoices — this layout (the list) stays
 * mounted across navigations between `/billing/invoices/[invoiceId]` routes
 * (Next.js layouts don't remount for nested route changes), which is what
 * gives the list-stays-put, detail-panel-swaps behavior in the Figma
 * reference without any client-side "selected id" state.
 */
export default async function InvoicesLayout({ children }: { children: ReactNode }) {
  const session = await requireRole(["DENTIST", "ADMIN"]);
  const [invoices, patients] = await Promise.all([
    listInvoices(session.user.organizationId),
    listPatients(session.user.organizationId),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold text-text-primary">Invoices</h1>
        <p className="text-sm text-text-secondary">Manage and track patient billing.</p>
      </div>

      <div className="grid grid-cols-1 overflow-hidden rounded-[var(--radius-xl)] border border-border bg-surface md:min-h-[600px] md:grid-cols-[360px_1fr] md:divide-x md:divide-border">
        <div className="overflow-y-auto">
          <InvoicesListPanel invoices={invoices} patients={patients} />
        </div>
        <div className="overflow-y-auto p-6">{children}</div>
      </div>
    </div>
  );
}
