"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2 } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { createManualInvoiceAction } from "@/lib/actions/create-manual-invoice";
import { patientFullName } from "@/lib/patient-format";
import { formatCentsAsCurrency } from "@/lib/billing-format";
import type { Patient } from "@/generated/prisma/client";
import type { TreatmentLineItemInput } from "@/lib/data/billing";

interface DraftLineItem {
  description: string;
  procedureCode: string;
  tooth: string;
  quadrant: string;
  quantity: string;
  /** Dollars, as typed (e.g. "120.00") — parsed to cents on submit. */
  unitPrice: string;
}

const EMPTY_ROW: DraftLineItem = {
  description: "",
  procedureCode: "",
  tooth: "",
  quadrant: "",
  quantity: "1",
  unitPrice: "",
};

const FIELD_CLASSES =
  "h-9 rounded-[var(--radius-md)] border border-border bg-surface px-2.5 text-sm text-text-primary placeholder:text-text-secondary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-brand-blue)]";

function toLineItems(rows: DraftLineItem[]): TreatmentLineItemInput[] {
  return rows
    .filter((r) => r.description.trim() && r.unitPrice.trim())
    .map((r) => ({
      description: r.description.trim(),
      procedureCode: r.procedureCode.trim() || undefined,
      tooth: r.tooth.trim() || undefined,
      quadrant: r.quadrant.trim() || undefined,
      quantity: Math.max(1, parseInt(r.quantity, 10) || 1),
      unitPriceCents: Math.round(parseFloat(r.unitPrice) * 100) || 0,
    }));
}

/**
 * "+ New Invoice" — the Invoices list's manual-invoice flow (patient +
 * freeform line items, not derived from a logged treatment). Self-contained
 * trigger + modal, following `SendInvoiceReminderButton`'s split-out-of-the-
 * server-rendered-page pattern.
 */
export function NewInvoiceModal({ patients }: { patients: Patient[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [patientId, setPatientId] = useState("");
  const [rows, setRows] = useState<DraftLineItem[]>([{ ...EMPTY_ROW }]);
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const lineItems = toLineItems(rows);
  const subtotalCents = lineItems.reduce((sum, li) => sum + li.quantity * li.unitPriceCents, 0);

  function reset() {
    setPatientId("");
    setRows([{ ...EMPTY_ROW }]);
    setNotes("");
    setError(null);
  }

  function handleClose() {
    setOpen(false);
    reset();
  }

  function updateRow(index: number, patch: Partial<DraftLineItem>) {
    setRows((prev) => prev.map((r, i) => (i === index ? { ...r, ...patch } : r)));
  }

  function addRow() {
    setRows((prev) => [...prev, { ...EMPTY_ROW }]);
  }

  function removeRow(index: number) {
    setRows((prev) => (prev.length === 1 ? prev : prev.filter((_, i) => i !== index)));
  }

  async function handleSubmit() {
    setError(null);
    if (!patientId) {
      setError("Select a patient.");
      return;
    }
    if (lineItems.length === 0) {
      setError("Add at least one line item with a description and price.");
      return;
    }
    setSubmitting(true);
    const result = await createManualInvoiceAction(patientId, lineItems, notes);
    setSubmitting(false);
    if (result.ok && result.invoiceId) {
      const invoiceId = result.invoiceId;
      handleClose();
      router.push(`/billing/invoices/${invoiceId}`);
      router.refresh();
    } else {
      setError(result.error ?? "Something went wrong.");
    }
  }

  return (
    <>
      <Button size="sm" onClick={() => setOpen(true)}>
        <Plus className="h-4 w-4" aria-hidden="true" />
        New Invoice
      </Button>

      <Modal
        open={open}
        onClose={handleClose}
        title="New Invoice"
        description="Create a manual invoice for a patient."
        footer={
          <>
            <Button variant="outline" onClick={handleClose} disabled={submitting}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={submitting}>
              {submitting
                ? "Creating…"
                : `Create Invoice${subtotalCents > 0 ? ` (${formatCentsAsCurrency(subtotalCents)})` : ""}`}
            </Button>
          </>
        }
      >
        <div className="flex flex-col gap-4">
          <div>
            <label htmlFor="new-invoice-patient" className="mb-1.5 block text-sm font-medium text-text-primary">
              Patient
            </label>
            <select
              id="new-invoice-patient"
              value={patientId}
              onChange={(e) => setPatientId(e.target.value)}
              className={`w-full ${FIELD_CLASSES}`}
            >
              <option value="">Select a patient…</option>
              {patients.map((p) => (
                <option key={p.id} value={p.id}>
                  {patientFullName(p)}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-3">
            <span className="text-sm font-medium text-text-primary">Line items</span>
            {rows.map((row, i) => (
              <div key={i} className="flex flex-col gap-2 rounded-[var(--radius-md)] border border-border p-3">
                <div className="flex gap-2">
                  <input
                    value={row.description}
                    onChange={(e) => updateRow(i, { description: e.target.value })}
                    placeholder="Description"
                    className={`flex-1 ${FIELD_CLASSES}`}
                  />
                  <input
                    value={row.procedureCode}
                    onChange={(e) => updateRow(i, { procedureCode: e.target.value })}
                    placeholder="Code"
                    className={`w-20 ${FIELD_CLASSES}`}
                  />
                  <button
                    type="button"
                    onClick={() => removeRow(i)}
                    aria-label="Remove line item"
                    disabled={rows.length === 1}
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[var(--radius-md)] text-text-secondary hover:bg-surface-muted hover:text-error-text disabled:opacity-40 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-brand-blue)]"
                  >
                    <Trash2 className="h-4 w-4" aria-hidden="true" />
                  </button>
                </div>
                <div className="flex gap-2">
                  <input
                    value={row.tooth}
                    onChange={(e) => updateRow(i, { tooth: e.target.value })}
                    placeholder="Tooth (optional)"
                    className={`flex-1 ${FIELD_CLASSES}`}
                  />
                  <input
                    value={row.quadrant}
                    onChange={(e) => updateRow(i, { quadrant: e.target.value })}
                    placeholder="Quadrant (optional)"
                    className={`flex-1 ${FIELD_CLASSES}`}
                  />
                  <input
                    value={row.quantity}
                    onChange={(e) => updateRow(i, { quantity: e.target.value })}
                    placeholder="Qty"
                    inputMode="numeric"
                    className={`w-16 ${FIELD_CLASSES}`}
                  />
                  <input
                    value={row.unitPrice}
                    onChange={(e) => updateRow(i, { unitPrice: e.target.value })}
                    placeholder="Unit price"
                    inputMode="decimal"
                    className={`w-24 ${FIELD_CLASSES}`}
                  />
                </div>
              </div>
            ))}
            <Button variant="outline" size="sm" onClick={addRow} className="self-start">
              <Plus className="h-4 w-4" aria-hidden="true" />
              Add line item
            </Button>
          </div>

          <div>
            <label htmlFor="new-invoice-notes" className="mb-1.5 block text-sm font-medium text-text-primary">
              Notes
            </label>
            <textarea
              id="new-invoice-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              placeholder="Optional notes…"
              className="w-full rounded-[var(--radius-md)] border border-border bg-surface p-3 text-sm text-text-primary placeholder:text-text-secondary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-brand-blue)]"
            />
          </div>

          {error && (
            <p role="alert" className="text-sm font-medium text-error-text">
              {error}
            </p>
          )}
        </div>
      </Modal>
    </>
  );
}
