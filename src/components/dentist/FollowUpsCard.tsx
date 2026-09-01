"use client";

import { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { getPatientById, patientFullName } from "@/lib/sample-data";

export interface FollowUpsCardProps {
  items: { patientId: string; reason: string }[];
}

export function FollowUpsCard({ items }: FollowUpsCardProps) {
  const [sent, setSent] = useState<Record<string, boolean>>({});

  return (
    <Card>
      <CardHeader>
        <CardTitle>Follow-ups</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {items.map(({ patientId, reason }) => {
          const patient = getPatientById(patientId);
          if (!patient) return null;
          const name = patientFullName(patient);
          const wasSent = sent[patientId];

          return (
            <div key={patientId} className="flex items-center justify-between gap-3">
              <div className="flex min-w-0 items-center gap-3">
                <Avatar name={name} src={patient.photoUrl} size="sm" />
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-text-primary">{name}</p>
                  <p className="truncate text-xs text-text-secondary">{reason}</p>
                </div>
              </div>
              <Button
                size="sm"
                variant={wasSent ? "secondary" : "outline"}
                onClick={() => setSent((prev) => ({ ...prev, [patientId]: true }))}
                aria-label={`Send reminder to ${name}`}
              >
                {wasSent ? "Sent" : "Remind"}
              </Button>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
