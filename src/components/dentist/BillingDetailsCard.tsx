"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Wallet, CalendarClock, Pencil, Check, X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { InsuranceIcon } from "@/components/ui/icons/purity-raster-icons";
import { formatCentsAsCurrency } from "@/lib/billing-format";
import { updatePatientBilling } from "@/lib/actions/update-patient";
import type { Patient } from "@/generated/prisma/client";

export interface BillingDetailsCardProps {
  patient: Patient;
  /** All three staff roles (Dentist/Hygienist/Receptionist) can edit billing details per the Figma permission matrix. */
  canEdit?: boolean;
}

/** One section of the patient identity panel — see `ContactDetailsCard`'s header comment. */
export function BillingDetailsCard({ patient, canEdit = false }: BillingDetailsCardProps) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [plan, setPlan] = useState(patient.insurancePlan ?? "");
  const [provider, setProvider] = useState(patient.insuranceProvider ?? "");
  const [error, setError] = useState<string | null>(null);

  async function handleSave() {
    setSaving(true);
    setError(null);
    const result = await updatePatientBilling(patient.id, { insuranceProvider: provider, insurancePlan: plan });
    setSaving(false);
    if (result.ok) {
      setEditing(false);
      router.refresh();
    } else {
      setError(result.error ?? "Couldn't save billing details. Please try again.");
    }
  }

  return (
    <section className="p-4">
      <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
        <h3 className="text-[15px] font-semibold tracking-tight text-text-primary">Billing Details</h3>
        {canEdit &&
          (!editing ? (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setEditing(true)}
              aria-label="Edit billing details"
            >
              <Pencil className="h-4 w-4" aria-hidden="true" />
              Edit
            </Button>
          ) : (
            <div className="flex gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleSave}
                disabled={saving}
                aria-label="Save billing details"
              >
                <Check className="h-4 w-4" aria-hidden="true" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setPlan(patient.insurancePlan ?? "");
                  setProvider(patient.insuranceProvider ?? "");
                  setError(null);
                  setEditing(false);
                }}
                disabled={saving}
                aria-label="Cancel editing billing details"
              >
                <X className="h-4 w-4" aria-hidden="true" />
              </Button>
            </div>
          ))}
      </div>
      <div className="mt-3 flex flex-col gap-3">
        {editing ? (
          <>
            <Input label="Insurance provider" value={provider} onChange={(e) => setProvider(e.target.value)} />
            <Input label="Insurance plan" value={plan} onChange={(e) => setPlan(e.target.value)} />
            {error && (
              <p role="alert" className="text-sm text-error">
                {error}
              </p>
            )}
          </>
        ) : (
          <div className="flex items-center gap-3 text-sm">
            <InsuranceIcon className="h-4 w-4 shrink-0" aria-hidden="true" />
            <span className="text-text-primary">
              {provider || "No insurance on file"}
              {provider && plan ? ` — ${plan}` : ""}
            </span>
          </div>
        )}

        <div className="flex items-center gap-3 text-sm">
          <Wallet className="h-4 w-4 shrink-0 text-text-secondary" aria-hidden="true" />
          <span className={patient.balanceCents > 0 ? "font-medium text-warning-text" : "text-text-primary"}>
            Balance: {formatCentsAsCurrency(patient.balanceCents)}
          </span>
        </div>

        <div className="flex items-center gap-3 text-sm">
          <CalendarClock className="h-4 w-4 shrink-0 text-text-secondary" aria-hidden="true" />
          <span className="text-text-primary">
            Next appointment:{" "}
            {patient.nextApptAt
              ? new Date(patient.nextApptAt).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })
              : "Not scheduled"}
          </span>
        </div>
      </div>
    </section>
  );
}
