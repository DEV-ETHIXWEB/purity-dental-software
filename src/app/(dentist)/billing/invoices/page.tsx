import { redirect } from "next/navigation";
import { requirePageRole } from "@/lib/auth/require-portal";
import { listInvoices } from "@/lib/data/billing";

/**
 * `/billing/invoices` with no id selected — redirects to the most recent
 * invoice so the detail panel always shows something (matching the Figma
 * reference, which never shows the list without a selection), falling back
 * to an empty state only when the org has no invoices at all.
 */
export default async function InvoicesIndexPage() {
  const session = await requirePageRole(["DENTIST", "ADMIN"]);
  const invoices = await listInvoices(session.user.organizationId);

  if (invoices.length > 0) {
    redirect(`/billing/invoices/${invoices[0].id}`);
  }

  return (
    <div className="flex h-full min-h-[300px] flex-col items-center justify-center gap-1 text-center">
      <p className="text-sm font-medium text-text-primary">No invoices yet</p>
      <p className="text-sm text-text-secondary">Use &ldquo;New Invoice&rdquo; to create one.</p>
    </div>
  );
}
