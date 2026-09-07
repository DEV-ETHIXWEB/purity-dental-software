"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Pencil, Check, X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { PhoneIcon, EmailIcon } from "@/components/ui/icons/purity-raster-icons";
import { updatePatientContact } from "@/lib/actions/update-patient";
import type { Patient } from "@/generated/prisma/client";

export interface ContactDetailsCardProps {
  patient: Patient;
  /** All three staff roles (Dentist/Hygienist/Receptionist) can edit contact details per the Figma permission matrix. */
  canEdit?: boolean;
}

/**
 * One section of the patient identity panel — composed alongside
 * `BillingDetailsCard` and Medical History inside a single shared `<Card>`
 * by the page, rather than each rendering its own bordered card. A patient
 * record should read as one coherent workspace, not a stack of boxes.
 */
export function ContactDetailsCard({ patient, canEdit = false }: ContactDetailsCardProps) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [phone, setPhone] = useState(patient.phone ?? "");
  const [email, setEmail] = useState(patient.email ?? "");
  const [error, setError] = useState<string | null>(null);

  async function handleSave() {
    setSaving(true);
    setError(null);
    const result = await updatePatientContact(patient.id, { phone, email });
    setSaving(false);
    if (result.ok) {
      setEditing(false);
      router.refresh();
    } else {
      setError(result.error ?? "Couldn't save contact details. Please try again.");
    }
  }

  return (
    <section className="p-4">
      <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
        <h3 className="text-[15px] font-semibold tracking-tight text-text-primary">Contact Details</h3>
        {canEdit &&
          (!editing ? (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setEditing(true)}
              aria-label="Edit contact details"
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
                aria-label="Save contact details"
              >
                <Check className="h-4 w-4" aria-hidden="true" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setPhone(patient.phone ?? "");
                  setEmail(patient.email ?? "");
                  setError(null);
                  setEditing(false);
                }}
                disabled={saving}
                aria-label="Cancel editing contact details"
              >
                <X className="h-4 w-4" aria-hidden="true" />
              </Button>
            </div>
          ))}
      </div>
      <div className="mt-3 flex flex-col gap-3">
        {editing ? (
          <>
            <Input
              label="Phone"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              type="tel"
            />
            <Input
              label="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              type="email"
            />
            {error && (
              <p role="alert" className="text-sm text-error">
                {error}
              </p>
            )}
          </>
        ) : (
          <>
            <div className="flex items-center gap-3 text-sm">
              <PhoneIcon className="h-4 w-4 shrink-0" aria-hidden="true" />
              <span className="text-text-primary">{phone || "Not on file"}</span>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <EmailIcon className="h-4 w-4 shrink-0" aria-hidden="true" />
              <span className="text-text-primary">{email || "Not on file"}</span>
            </div>
          </>
        )}
      </div>
    </section>
  );
}
