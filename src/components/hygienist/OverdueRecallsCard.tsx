"use client";

import { useState } from "react";
import { BellRing } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { RecallAlertModal } from "@/components/hygienist/RecallAlertModal";
import { type SamplePatient, patientFullName } from "@/lib/sample-data";

export interface OverdueRecallsCardProps {
  patients: SamplePatient[];
}

/**
 * Surfaces patients with an overdue recall (`recallStatus` containing
 * "Overdue") with a one-click "Send Recall Alert" action per patient —
 * the Patients-list integration of the whiteboard's "Recall (overdue
 * patients): send alert" sitemap node. See also the per-conversation recall
 * action on the Messages screen for patients already in a thread.
 */
export function OverdueRecallsCard({ patients }: OverdueRecallsCardProps) {
  const overdue = patients.filter((p) => p.recallStatus.toLowerCase().includes("overdue"));
  const [activePatientId, setActivePatientId] = useState<string | null>(null);
  const [sentIds, setSentIds] = useState<Record<string, boolean>>({});

  const activePatient = overdue.find((p) => p.id === activePatientId) ?? null;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Overdue Recalls</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        {overdue.length === 0 ? (
          <p className="text-sm text-text-secondary">No patients are overdue for a recall visit.</p>
        ) : (
          overdue.map((patient) => {
            const name = patientFullName(patient);
            const wasSent = sentIds[patient.id];
            return (
              <div key={patient.id} className="flex items-center justify-between gap-3">
                <div className="flex min-w-0 items-center gap-3">
                  <Avatar name={name} src={patient.photoUrl} size="sm" />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-text-primary">{name}</p>
                    <p className="truncate text-xs text-text-secondary">{patient.recallStatus}</p>
                  </div>
                </div>
                <Button
                  size="sm"
                  variant={wasSent ? "secondary" : "outline"}
                  onClick={() => setActivePatientId(patient.id)}
                  aria-label={`Send recall alert to ${name}`}
                >
                  <BellRing className="h-4 w-4" aria-hidden="true" />
                  {wasSent ? "Sent" : "Send Recall Alert"}
                </Button>
              </div>
            );
          })
        )}
      </CardContent>

      {activePatient && (
        <RecallAlertModal
          open={!!activePatientId}
          onClose={() => setActivePatientId(null)}
          patientName={patientFullName(activePatient)}
          onSent={() => setSentIds((prev) => ({ ...prev, [activePatient.id]: true }))}
        />
      )}
    </Card>
  );
}
