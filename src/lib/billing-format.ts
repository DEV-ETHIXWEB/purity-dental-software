import type { Invoice } from "@/generated/prisma/client";

/**
 * Pure, client-safe billing formatting helpers — deliberately NOT in
 * `src/lib/data/billing.ts` (which is `"server-only"` and pulls in Prisma
 * transitively). Client Components (invoice tables/cards, payment modals)
 * need these constantly, so they live in their own dependency-free module.
 */

export function formatCentsAsCurrency(cents: number): string {
  return (cents / 100).toLocaleString("en-US", { style: "currency", currency: "USD" });
}

/** Human-readable invoice number, e.g. "INV-1001" — derived from the DB sequence, never stored redundantly. */
export function invoiceNumber(invoice: Pick<Invoice, "invoiceSeq">): string {
  return `INV-${1000 + invoice.invoiceSeq}`;
}
