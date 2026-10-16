import type { ReactNode } from "react";
import { requirePagePermission } from "@/lib/auth/require-portal";
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
  const session = await requirePagePermission("billing.view", ["DENTIST", "ADMIN"]);
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

      {/*
        * `minmax(0, 1fr)` rather than `1fr`: a bare `1fr` track has an
        * implicit `min-content` floor, so a wide child (the line-items table)
        * pushed the detail pane past the card's edge instead of letting it
        * scroll inside itself. The list is narrower on tablets so the detail
        * pane keeps a usable width at 768px.
        */}
      <div className="grid grid-cols-1 overflow-hidden rounded-[var(--radius-xl)] border border-border bg-surface md:min-h-[600px] md:grid-cols-[300px_minmax(0,1fr)] md:divide-x md:divide-border lg:grid-cols-[360px_minmax(0,1fr)]">
        <div className="min-w-0 overflow-y-auto">
          <InvoicesListPanel invoices={invoices} patients={patients} />
        </div>
        {/*
          * A size container: the detail page lays itself out from THIS
          * pane's width (`@xl:` etc.), not the viewport's. Its viewport
          * breakpoints were firing for a 1000px window while the pane was
          * ~490px, which is what overlapped the header and cropped Summary.
          */}
        <div className="@container min-w-0 overflow-y-auto p-4 sm:p-6">{children}</div>
      </div>
    </div>
  );
}
