import Link from "next/link";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { type SamplePatient, patientFullName } from "@/lib/sample-data";

const ALERT_TONE = "error" as const;

export interface RecentConsultationCardProps {
  patient: SamplePatient;
  observation: string;
  /** Portal route prefix for the patient profile link (e.g. "/hygienist"). Defaults to the Dentist portal's root. */
  basePath?: string;
}

export function RecentConsultationCard({
  patient,
  observation,
  basePath = "",
}: RecentConsultationCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Consultation</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div className="flex items-center gap-3">
          <Avatar name={patientFullName(patient)} src={patient.photoUrl} size="lg" />
          <div className="min-w-0">
            <Link
              href={`${basePath}/patients/${patient.id}`}
              className="truncate font-semibold text-text-primary hover:text-[var(--color-brand-blue-text)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-brand-blue)] rounded-[var(--radius-sm)]"
            >
              {patientFullName(patient)}
            </Link>
            <p className="text-sm text-text-secondary">
              Last cleaning:{" "}
              {patient.lastCleaningAt
                ? new Date(patient.lastCleaningAt).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })
                : "No record"}
            </p>
          </div>
        </div>

        {patient.medicalAlerts.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {patient.medicalAlerts.map((alert) => (
              <Badge key={alert} tone={ALERT_TONE}>
                {alert}
              </Badge>
            ))}
          </div>
        )}

        <p className="rounded-[var(--radius-md)] bg-surface-muted p-3 text-sm text-text-primary">
          {observation}
        </p>
      </CardContent>
    </Card>
  );
}
