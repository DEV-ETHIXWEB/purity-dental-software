"use client";

import { useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { formatCentsAsCurrency } from "@/lib/sample-data";

interface ProcedureOption {
  id: string;
  label: string;
  priceCents: number;
}

const PROCEDURE_OPTIONS: ProcedureOption[] = [
  { id: "exam", label: "Comprehensive Exam", priceCents: 12000 },
  { id: "xray", label: "Bitewing X-Rays", priceCents: 6500 },
  { id: "cleaning", label: "Routine Cleaning", priceCents: 9500 },
  { id: "filling", label: "Composite Filling", priceCents: 18000 },
  { id: "crown", label: "Porcelain Crown", priceCents: 95000 },
  { id: "whitening", label: "Teeth Whitening", priceCents: 35000 },
];

export interface LogTreatmentModalProps {
  open: boolean;
  onClose: () => void;
  patientName: string;
  onSendToBilling: (selected: ProcedureOption[], notes: string) => void;
}

export function LogTreatmentModal({
  open,
  onClose,
  patientName,
  onSendToBilling,
}: LogTreatmentModalProps) {
  const [checked, setChecked] = useState<Record<string, boolean>>({});
  const [notes, setNotes] = useState("");

  const selected = PROCEDURE_OPTIONS.filter((p) => checked[p.id]);
  const total = selected.reduce((sum, p) => sum + p.priceCents, 0);

  function toggle(id: string) {
    setChecked((prev) => ({ ...prev, [id]: !prev[id] }));
  }

  function handleSend() {
    onSendToBilling(selected, notes);
    setChecked({});
    setNotes("");
    onClose();
  }

  function handleCancel() {
    setChecked({});
    setNotes("");
    onClose();
  }

  return (
    <Modal
      open={open}
      onClose={handleCancel}
      title="Log Treatment & Send to Billing"
      description={`Record procedures performed for ${patientName}.`}
      footer={
        <>
          <Button variant="outline" onClick={handleCancel}>
            Cancel
          </Button>
          <Button onClick={handleSend} disabled={selected.length === 0}>
            Send to Billing{selected.length > 0 ? ` (${formatCentsAsCurrency(total)})` : ""}
          </Button>
        </>
      }
    >
      <fieldset className="flex flex-col gap-3">
        <legend className="mb-1 text-sm font-medium text-text-primary">
          Procedures performed
        </legend>
        {PROCEDURE_OPTIONS.map((option) => (
          <label
            key={option.id}
            className="flex cursor-pointer items-center justify-between gap-3 rounded-[var(--radius-md)] border border-border p-3 text-sm hover:bg-surface-muted"
          >
            <span className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={!!checked[option.id]}
                onChange={() => toggle(option.id)}
                className="h-4 w-4 rounded border-border-strong text-[var(--color-brand-blue)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-brand-blue)]"
              />
              <span className="text-text-primary">{option.label}</span>
            </span>
            <span className="text-text-secondary">{formatCentsAsCurrency(option.priceCents)}</span>
          </label>
        ))}
      </fieldset>

      <div className="mt-4">
        <label htmlFor="treatment-notes" className="mb-1.5 block text-sm font-medium text-text-primary">
          Notes
        </label>
        <textarea
          id="treatment-notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={3}
          placeholder="Add any clinical notes for this visit…"
          className="w-full rounded-[var(--radius-md)] border border-border bg-surface p-3 text-sm text-text-primary placeholder:text-text-secondary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-brand-blue)]"
        />
      </div>
    </Modal>
  );
}
