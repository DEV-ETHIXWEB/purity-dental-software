"use client";

import { useState } from "react";
import { ShieldCheck, Wallet, CalendarClock, Pencil, Check, X } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { formatCentsAsCurrency, type SamplePatient } from "@/lib/sample-data";

export function BillingDetailsCard({ patient }: { patient: SamplePatient }) {
  const [editing, setEditing] = useState(false);
  const [plan, setPlan] = useState(patient.insurancePlan);
  const [provider, setProvider] = useState(patient.insuranceProvider);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Billing Details</CardTitle>
        {!editing ? (
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
              onClick={() => setEditing(false)}
              aria-label="Save billing details"
            >
              <Check className="h-4 w-4" aria-hidden="true" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setPlan(patient.insurancePlan);
                setProvider(patient.insuranceProvider);
                setEditing(false);
              }}
              aria-label="Cancel editing billing details"
            >
              <X className="h-4 w-4" aria-hidden="true" />
            </Button>
          </div>
        )}
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {editing ? (
          <>
            <Input label="Insurance provider" value={provider} onChange={(e) => setProvider(e.target.value)} />
            <Input label="Insurance plan" value={plan} onChange={(e) => setPlan(e.target.value)} />
          </>
        ) : (
          <div className="flex items-center gap-3 text-sm">
            <ShieldCheck className="h-4 w-4 shrink-0 text-text-secondary" aria-hidden="true" />
            <span className="text-text-primary">
              {provider} — {plan}
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
      </CardContent>
    </Card>
  );
}
