import Link from "next/link";
import { cn } from "@/lib/cn";
import { ArrowRight } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { patientFullName, patientAge } from "@/lib/patient-format";
import type { Patient } from "@/generated/prisma/client";

const ALERT_TONE = "error" as const;

export interface RecentConsultationCardProps {
  patient: Patient;
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
    <Card className="animate-rise-in stagger-3 transition-shadow duration-300 ease-out hover:shadow-card-hover">
      <CardHeader>
        <CardTitle>Recent Consultation</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div className="group/patient flex items-center gap-3">
          <Avatar
            name={patientFullName(patient)}
            src={patient.photoUrl}
            size="lg"
            className="transition-transform duration-200 ease-out group-hover/patient:-translate-y-0.5 motion-reduce:group-hover/patient:translate-y-0"
          />
          <div className="min-w-0">
            <Link
              href={`${basePath}/patients/${patient.id}`}
              className="truncate font-semibold text-text-primary transition-all duration-200 ease-out hover:text-[var(--color-brand-blue-text)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-brand-blue)] rounded-[var(--radius-sm)] group-hover/patient:-translate-y-0.5 group-hover/patient:text-[var(--color-brand-blue-text)] motion-reduce:group-hover/patient:translate-y-0"
            >
              {patientFullName(patient)}
            </Link>
            <p className="text-sm text-text-secondary">
              Age {patientAge(patient)} · {patient.sex === "MALE" ? "Male" : patient.sex === "FEMALE" ? "Female" : "Other"}
            </p>
          </div>
        </div>

        {patient.medicalAlerts.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {patient.medicalAlerts.map((alert) => (
              <Badge
                key={alert}
                tone={ALERT_TONE}
                className="transition-transform duration-200 ease-out hover:-translate-y-0.5 motion-reduce:hover:translate-y-0"
              >
                {alert}
              </Badge>
            ))}
          </div>
        )}

        <div className="rounded-[var(--radius-md)] bg-surface-muted p-3 text-sm transition-colors duration-200 ease-out hover:bg-surface-sunken">
          <p className="text-text-secondary">
            Last cleaning:{" "}
            <span className="text-text-primary">
              {patient.lastCleaningAt
                ? new Date(patient.lastCleaningAt).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })
                : "No record"}
            </span>
          </p>
          <p className="mt-1 text-text-primary">{observation}</p>
        </div>

        <Link
          href={`${basePath}/patients/${patient.id}`}
          className={cn(
            "group/details inline-flex items-center gap-1.5 self-start rounded-[var(--radius-sm)] text-sm font-medium text-[var(--color-brand-blue-text)]",
            "hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-brand-blue)]",
          )}
        >
          View details
          <ArrowRight
            className="h-3.5 w-3.5 transition-transform duration-200 ease-out group-hover/details:translate-x-1 motion-reduce:group-hover/details:translate-x-0"
            aria-hidden="true"
          />
        </Link>
      </CardContent>
    </Card>
  );
}
