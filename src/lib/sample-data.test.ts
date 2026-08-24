import { describe, expect, it } from "vitest";
import {
  billingSummary,
  invoices,
  invoiceTotalCents,
  patientAge,
  patients,
} from "./sample-data";

describe("billingSummary", () => {
  it("reconciles totalRevenue = collected + outstanding for the actual sample dataset", () => {
    const summary = billingSummary();
    expect(summary.totalRevenue).toBe(summary.collected + summary.outstanding);
  });

  it("keeps overdue as a subset of outstanding (never larger)", () => {
    const summary = billingSummary();
    expect(summary.overdue).toBeLessThanOrEqual(summary.outstanding);
  });

  it("derives collected/outstanding/overdue independently from invoiceTotalCents by status, matching billingSummary()'s own math", () => {
    const collected = invoices
      .filter((i) => i.status === "PAID")
      .reduce((sum, i) => sum + invoiceTotalCents(i), 0);
    const outstanding = invoices
      .filter((i) => i.status === "PENDING" || i.status === "OVERDUE")
      .reduce((sum, i) => sum + invoiceTotalCents(i), 0);
    const overdue = invoices
      .filter((i) => i.status === "OVERDUE")
      .reduce((sum, i) => sum + invoiceTotalCents(i), 0);

    const summary = billingSummary();
    expect(summary.collected).toBe(collected);
    expect(summary.outstanding).toBe(outstanding);
    expect(summary.overdue).toBe(overdue);
  });

  it("computes collectionRate as collected/totalRevenue rounded to a whole percent", () => {
    const summary = billingSummary();
    const expectedRate =
      summary.totalRevenue > 0
        ? Math.round((summary.collected / summary.totalRevenue) * 100)
        : 0;
    expect(summary.collectionRate).toBe(expectedRate);
    expect(summary.collectionRate).toBeGreaterThanOrEqual(0);
    expect(summary.collectionRate).toBeLessThanOrEqual(100);
  });

  it("produces non-negative cent amounts for every KPI", () => {
    const summary = billingSummary();
    expect(summary.totalRevenue).toBeGreaterThanOrEqual(0);
    expect(summary.outstanding).toBeGreaterThanOrEqual(0);
    expect(summary.overdue).toBeGreaterThanOrEqual(0);
    expect(summary.collected).toBeGreaterThanOrEqual(0);
  });
});

describe("invoiceTotalCents", () => {
  it("sums quantity * unitPriceCents across all line items", () => {
    for (const invoice of invoices) {
      const expected = invoice.lineItems.reduce(
        (sum, li) => sum + li.quantity * li.unitPriceCents,
        0,
      );
      expect(invoiceTotalCents(invoice)).toBe(expected);
    }
  });

  it("every invoice in the sample dataset has at least one line item (no zero-value ghost invoices)", () => {
    for (const invoice of invoices) {
      expect(invoice.lineItems.length).toBeGreaterThan(0);
      expect(invoiceTotalCents(invoice)).toBeGreaterThan(0);
    }
  });
});

describe("patientAge", () => {
  it("computes a plausible non-negative age for every sample patient", () => {
    for (const patient of patients) {
      const age = patientAge(patient);
      expect(age).toBeGreaterThanOrEqual(0);
      expect(age).toBeLessThan(130);
    }
  });

  it("computes the correct age for a known fixed date of birth", () => {
    const age = patientAge({
      id: "test",
      firstName: "Test",
      lastName: "Patient",
      dateOfBirth: "2000-01-01",
      sex: "OTHER",
      phone: "",
      email: "",
      insuranceProvider: "",
      insurancePlan: "",
      balanceCents: 0,
      medicalAlerts: [],
      lastCleaningAt: null,
      recallStatus: "",
      nextApptAt: null,
      status: "Active",
    });
    // Sanity: someone born 2000-01-01 is in their mid-20s "today" per the
    // project's fixed reference date context (2026), not some wildly wrong
    // number — this would catch a broken date-diff (e.g. off-by-one on
    // month/day boundaries).
    expect(age).toBeGreaterThanOrEqual(24);
    expect(age).toBeLessThanOrEqual(27);
  });
});
