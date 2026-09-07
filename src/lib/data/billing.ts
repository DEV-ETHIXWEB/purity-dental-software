import "server-only";
import { prisma } from "@/lib/prisma";
import type { Invoice, InvoiceLineItem, Patient, User } from "@/generated/prisma/client";

/**
 * Real Prisma-backed billing queries — replaces the fixed invoice fixtures
 * previously in `src/lib/sample-data.ts`. `Invoice.totalCents` is a
 * denormalized snapshot (see schema comment) kept in sync at write time by
 * `createInvoiceFromTreatment` below; reads trust that column rather than
 * re-summing line items on every render.
 *
 * Pure formatting helpers (formatCentsAsCurrency, invoiceNumber) live in
 * `@/lib/billing-format` instead of here — this
 * module is `"server-only"`, which would make those unusable from Client
 * Components too.
 */

export type InvoiceWithDetails = Invoice & { lineItems: InvoiceLineItem[]; patient: Patient };
/** Invoice detail view additionally needs the treating provider's name. */
export type InvoiceWithProvider = InvoiceWithDetails & { provider: User | null };

export async function listInvoices(organizationId: string): Promise<InvoiceWithDetails[]> {
  return prisma.invoice.findMany({
    where: { organizationId },
    include: { lineItems: true, patient: true },
    orderBy: { issuedAt: "desc" },
  });
}

export async function getInvoiceById(
  organizationId: string,
  id: string,
): Promise<InvoiceWithProvider | null> {
  return prisma.invoice.findFirst({
    where: { id, organizationId },
    include: { lineItems: true, patient: true, provider: true },
  });
}

/** Invoices for a single patient (Patient portal's own Bills page). */
export async function listInvoicesForPatient(
  organizationId: string,
  patientId: string,
): Promise<InvoiceWithDetails[]> {
  return prisma.invoice.findMany({
    where: { organizationId, patientId },
    include: { lineItems: true, patient: true },
    orderBy: { issuedAt: "desc" },
  });
}

export interface BillingMetric {
  value: number;
  /**
   * % change vs. the same metric computed for invoices *issued* last
   * calendar month. This is an approximation for `outstanding`/`overdue` —
   * the app has no status-change history (no `paidAt`, no audit trail of
   * when an invoice flipped PENDING→PAID), so there's no way to reconstruct
   * "what the outstanding balance actually was at the end of last month".
   * Instead this compares "how much PENDING/OVERDUE balance was issued last
   * month" to the same for this month — a flow metric, not a true
   * historical snapshot. `collected`/`totalRevenue` deltas are the same
   * shape for consistency, though they read more naturally this way.
   * Null when last month has zero baseline (avoids a meaningless ±∞%).
   */
  deltaPct: number | null;
}

export interface BillingSummary {
  totalRevenue: BillingMetric;
  outstanding: BillingMetric;
  overdue: BillingMetric;
  collected: BillingMetric;
  collectionRate: number;
}

function monthRange(monthsAgo: number): { start: Date; end: Date } {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth() - monthsAgo, 1);
  const end = new Date(now.getFullYear(), now.getMonth() - monthsAgo + 1, 1);
  return { start, end };
}

async function monthlyTotals(organizationId: string, monthsAgo: number) {
  const { start, end } = monthRange(monthsAgo);
  const invoices = await prisma.invoice.findMany({
    where: { organizationId, issuedAt: { gte: start, lt: end } },
    select: { status: true, totalCents: true },
  });

  let collected = 0;
  let outstanding = 0;
  let overdue = 0;
  for (const inv of invoices) {
    if (inv.status === "PAID") collected += inv.totalCents;
    if (inv.status === "PENDING" || inv.status === "OVERDUE") outstanding += inv.totalCents;
    if (inv.status === "OVERDUE") overdue += inv.totalCents;
  }
  return { collected, outstanding, overdue, totalRevenue: collected + outstanding };
}

function deltaPct(current: number, previous: number): number | null {
  if (previous === 0) return null;
  return Math.round(((current - previous) / previous) * 100);
}

/** Billing KPIs, computed server-side so cards always reconcile: totalRevenue = collected + outstanding. */
export async function billingSummary(organizationId: string): Promise<BillingSummary> {
  const [collectedAgg, outstandingAgg, overdueAgg, thisMonth, lastMonth] = await Promise.all([
    prisma.invoice.aggregate({
      where: { organizationId, status: "PAID" },
      _sum: { totalCents: true },
    }),
    prisma.invoice.aggregate({
      where: { organizationId, status: { in: ["PENDING", "OVERDUE"] } },
      _sum: { totalCents: true },
    }),
    prisma.invoice.aggregate({
      where: { organizationId, status: "OVERDUE" },
      _sum: { totalCents: true },
    }),
    monthlyTotals(organizationId, 0),
    monthlyTotals(organizationId, 1),
  ]);

  const collected = collectedAgg._sum.totalCents ?? 0;
  const outstanding = outstandingAgg._sum.totalCents ?? 0;
  const overdue = overdueAgg._sum.totalCents ?? 0;
  const totalRevenue = collected + outstanding;
  const collectionRate = totalRevenue > 0 ? Math.round((collected / totalRevenue) * 100) : 0;

  return {
    totalRevenue: { value: totalRevenue, deltaPct: deltaPct(thisMonth.totalRevenue, lastMonth.totalRevenue) },
    outstanding: { value: outstanding, deltaPct: deltaPct(thisMonth.outstanding, lastMonth.outstanding) },
    overdue: { value: overdue, deltaPct: deltaPct(thisMonth.overdue, lastMonth.overdue) },
    collected: { value: collected, deltaPct: deltaPct(thisMonth.collected, lastMonth.collected) },
    collectionRate,
  };
}

/**
 * Collected vs. outstanding totals per calendar month, for the billing
 * dashboard's Cashflow Trend chart. "thisYear" = Jan-Dec of the current
 * year (matches the Figma reference exactly, including empty future
 * months); "last12Months" = a rolling trailing window ending this month.
 */
export async function cashflowTrend(
  organizationId: string,
  range: "thisYear" | "last12Months" = "thisYear",
): Promise<{ month: string; collected: number; outstanding: number }[]> {
  const now = new Date();
  const months: { year: number; monthIndex: number; label: string }[] = [];
  if (range === "thisYear") {
    for (let m = 0; m < 12; m++) {
      months.push({ year: now.getFullYear(), monthIndex: m, label: new Date(now.getFullYear(), m, 1).toLocaleString("en-US", { month: "short" }) });
    }
  } else {
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      months.push({ year: d.getFullYear(), monthIndex: d.getMonth(), label: d.toLocaleString("en-US", { month: "short" }) });
    }
  }

  const rangeStart = new Date(months[0].year, months[0].monthIndex, 1);
  const rangeEnd = new Date(months[months.length - 1].year, months[months.length - 1].monthIndex + 1, 1);
  const invoices = await prisma.invoice.findMany({
    where: { organizationId, issuedAt: { gte: rangeStart, lt: rangeEnd } },
    select: { issuedAt: true, status: true, totalCents: true },
  });

  const key = (year: number, monthIndex: number) => `${year}-${monthIndex}`;
  const totals = new Map(months.map((m) => [key(m.year, m.monthIndex), { collected: 0, outstanding: 0 }]));
  for (const inv of invoices) {
    const bucket = totals.get(key(inv.issuedAt.getFullYear(), inv.issuedAt.getMonth()));
    if (!bucket) continue;
    if (inv.status === "PAID") bucket.collected += inv.totalCents / 100;
    else if (inv.status === "PENDING" || inv.status === "OVERDUE") bucket.outstanding += inv.totalCents / 100;
  }

  return months.map((m) => ({ month: m.label, ...totals.get(key(m.year, m.monthIndex))! }));
}

/** Outstanding (PENDING/OVERDUE) balance grouped by days-since-issued bucket. */
export async function outstandingByAge(
  organizationId: string,
): Promise<{ bucket: string; amountCents: number }[]> {
  const invoices = await prisma.invoice.findMany({
    where: { organizationId, status: { in: ["PENDING", "OVERDUE"] } },
    select: { issuedAt: true, totalCents: true },
  });

  const now = Date.now();
  const buckets = { "0-30 days": 0, "31-60 days": 0, "60+ days": 0 };
  for (const inv of invoices) {
    const ageDays = (now - inv.issuedAt.getTime()) / 86_400_000;
    if (ageDays <= 30) buckets["0-30 days"] += inv.totalCents;
    else if (ageDays <= 60) buckets["31-60 days"] += inv.totalCents;
    else buckets["60+ days"] += inv.totalCents;
  }

  return Object.entries(buckets).map(([bucket, amountCents]) => ({ bucket, amountCents }));
}

export interface TreatmentLineItemInput {
  description: string;
  procedureCode?: string;
  /** Tooth number/quadrant this line applies to, e.g. "#14" / "Upper Left" — optional, not every procedure is tooth-specific. */
  tooth?: string;
  quadrant?: string;
  quantity: number;
  unitPriceCents: number;
}

/**
 * Placeholder billing-adjustment heuristics (not real insurance-plan
 * adjudication) — mirrored in `prisma/seed.ts`'s `computeInvoiceTotals` so
 * seeded invoices and ones created live through the app total the same way.
 * See the matching comment on `Invoice.insuranceAdjustmentCents` in the
 * Prisma schema.
 */
const INSURANCE_ADJUSTMENT_RATE = 0.15;
const TAX_RATE = 0.08;

function computeInvoiceTotals(subtotalCents: number, hasInsurance: boolean) {
  const insuranceAdjustmentCents = hasInsurance ? Math.round(subtotalCents * INSURANCE_ADJUSTMENT_RATE) : 0;
  const taxCents = Math.round((subtotalCents - insuranceAdjustmentCents) * TAX_RATE);
  const totalCents = subtotalCents - insuranceAdjustmentCents + taxCents;
  return { insuranceAdjustmentCents, taxCents, totalCents };
}

/**
 * Create a real Invoice + InvoiceLineItem rows from a completed treatment —
 * backs `LogTreatmentModal`'s "Send to Billing" action (the Figma flow's
 * "+Services → Send to billing" step). Due 14 days from issue, matching the
 * spread already used across the seeded invoice fixtures.
 *
 * `Patient.balanceCents` is likewise a denormalized snapshot (what the
 * patient currently owes) — it must be incremented in the same transaction
 * as the Invoice write, or the two would drift apart under a mid-write
 * failure and every "Balance" display (BillingDetailsCard, invoice cards)
 * would silently show a stale amount. It's incremented by `totalCents`
 * (post tax/insurance-adjustment), the same final "amount owed" figure
 * shown everywhere else — never the raw line-item subtotal.
 */
export async function createInvoiceFromTreatment(params: {
  organizationId: string;
  patientId: string;
  providerId?: string;
  lineItems: TreatmentLineItemInput[];
  notes?: string;
}): Promise<Invoice> {
  const subtotalCents = params.lineItems.reduce((sum, li) => sum + li.quantity * li.unitPriceCents, 0);
  const issuedAt = new Date();
  const dueAt = new Date(issuedAt);
  dueAt.setDate(dueAt.getDate() + 14);

  return prisma.$transaction(async (tx) => {
    const patient = await tx.patient.findFirstOrThrow({
      where: { id: params.patientId, organizationId: params.organizationId },
      select: { insuranceProvider: true },
    });
    const { insuranceAdjustmentCents, taxCents, totalCents } = computeInvoiceTotals(
      subtotalCents,
      !!patient.insuranceProvider,
    );

    const invoice = await tx.invoice.create({
      data: {
        organizationId: params.organizationId,
        patientId: params.patientId,
        providerId: params.providerId,
        status: "PENDING",
        issuedAt,
        dueAt,
        insuranceAdjustmentCents,
        taxCents,
        totalCents,
        notes: params.notes || undefined,
        lineItems: { create: params.lineItems },
      },
    });

    await tx.patient.update({
      where: { id: params.patientId },
      data: { balanceCents: { increment: totalCents } },
    });

    return invoice;
  });
}

/**
 * Manual invoice creation — backs the Invoices page's "+ New Invoice" flow
 * (patient picker + freeform line items, not tied to a logged treatment).
 * Same underlying write as `createInvoiceFromTreatment`; kept as a separate
 * export so `logTreatmentAndSendToBilling` and the "+ New Invoice" action
 * can each record their own distinct audit-log action name.
 */
export const createManualInvoice = createInvoiceFromTreatment;
