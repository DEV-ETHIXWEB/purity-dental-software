"use client";

import { useState } from "react";
import { ClipboardPlus } from "lucide-react";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { RecallStatusBadge } from "@/components/dentist/PatientStatusBadge";
import { LogTreatmentModal } from "@/components/dentist/LogTreatmentModal";
import {
  type SamplePatient,
  patientFullName,
  patientAge,
} from "@/lib/sample-data";

export function PatientProfileHeader({ patient }: { patient: SamplePatient }) {
  const [modalOpen, setModalOpen] = useState(false);
  const name = patientFullName(patient);

  return (
    <div className="flex flex-col gap-4 rounded-[var(--radius-xl)] border border-border bg-surface p-5 shadow-card sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-4">
        <Avatar name={name} src={patient.photoUrl} size="lg" />
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

      <Button onClick={() => setModalOpen(true)}>
        <ClipboardPlus className="h-4 w-4" aria-hidden="true" />
        Log Treatment
      </Button>

      <LogTreatmentModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        patientName={name}
        onSendToBilling={() => {
          // PLACEHOLDER: no live database/billing pipeline yet — in the
          // real implementation this creates an Invoice + InvoiceLineItems
          // scoped to this patient's organizationId and writes an AuditLog
          // entry. For now this is a no-op beyond closing the modal.
        }}
      />
    </div>
  );
}
