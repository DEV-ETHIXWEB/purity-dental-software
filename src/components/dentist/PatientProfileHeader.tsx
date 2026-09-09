"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ClipboardPlus } from "lucide-react";
import { cn } from "@/lib/cn";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { RecallStatusBadge } from "@/components/dentist/PatientStatusBadge";
import { LogTreatmentModal } from "@/components/dentist/LogTreatmentModal";
import { patientFullName, patientAge } from "@/lib/patient-format";
import { logTreatmentAndSendToBilling } from "@/lib/actions/log-treatment";
import type { Patient } from "@/generated/prisma/client";

export interface PatientProfileHeaderProps {
  patient: Patient;
  /** Only clinical roles (Dentist/Hygienist) log treatment — Receptionist manages demographics/billing/contact, not charting. */
  canLogTreatment?: boolean;
  /**
   * "standalone" (default) draws its own card. "section" drops the chrome so
   * the page can compose identity, contact and billing into one card — the
   * Figma patient profile reads as a single header band, not three boxes.
   */
  variant?: "standalone" | "section";
}

export function PatientProfileHeader({
  patient,
  canLogTreatment = false,
  variant = "standalone",
}: PatientProfileHeaderProps) {
  const router = useRouter();
  const [modalOpen, setModalOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const name = patientFullName(patient);

  return (
    <div
      className={cn(
        "flex flex-col gap-4",
        variant === "standalone"
          ? "rounded-[var(--radius-xl)] border border-border bg-surface p-5 shadow-card sm:flex-row sm:items-center sm:justify-between"
          : "p-4",
      )}
    >
      <div className="flex items-center gap-4">
        <Avatar name={name} src={patient.photoUrl ?? undefined} size="lg" />
        <div>
          <h1 className="text-xl font-semibold text-text-primary">{name}</h1>
          <p className="text-sm text-text-secondary">
            {new Date(patient.dateOfBirth).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric",
            })}{" "}
            ({patientAge(patient)} yrs) · {patient.sex === "MALE" ? "Male" : patient.sex === "FEMALE" ? "Female" : "Other"}
          </p>
          <div className="mt-2">
            <RecallStatusBadge status={patient.recallStatus} />
          </div>
        </div>
      </div>

      {canLogTreatment && (
        <div className={cn("flex flex-col gap-1.5", variant === "standalone" ? "items-end" : "items-start")}>
          <Button onClick={() => setModalOpen(true)}>
            <ClipboardPlus className="h-4 w-4" aria-hidden="true" />
            Log Treatment
          </Button>
          {error && (
            <p role="alert" className="text-xs text-error">
              {error}
            </p>
          )}
        </div>
      )}

      {canLogTreatment && (
        <LogTreatmentModal
          open={modalOpen}
          onClose={() => setModalOpen(false)}
          patientName={name}
          onSendToBilling={async (selected, notes) => {
            setError(null);
            const result = await logTreatmentAndSendToBilling(
              patient.id,
              selected.map((s) => ({ description: s.label, quantity: 1, unitPriceCents: s.priceCents })),
              notes,
            );
            if (!result.ok) {
              setError(result.error ?? "Something went wrong.");
              return;
            }
            router.refresh();
          }}
        />
      )}
    </div>
  );
}
