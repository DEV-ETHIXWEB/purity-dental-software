import { FileText, ImageIcon, Pill } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/patient/EmptyState";
import { PrescriptionIcon } from "@/components/ui/icons/purity-raster-icons";
import { cn } from "@/lib/cn";
import type { DocumentSummary, PrescriptionWithPrescriber } from "@/lib/data/clinical-records";

export interface PatientRecordsCardProps {
  prescriptions: PrescriptionWithPrescriber[];
  documents: DocumentSummary[];
}

const STAGGER = ["stagger-0", "stagger-1", "stagger-2", "stagger-3", "stagger-4", "stagger-5"];

const ROW_CLASSES =
  "animate-rise-in flex items-center gap-3 rounded-[var(--radius-lg)] border border-border bg-surface p-3 transition-all duration-200 ease-out hover:-translate-y-0.5 hover:border-border-strong hover:shadow-card motion-reduce:hover:translate-y-0";

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

/**
 * The patient's own read-only view of what the practice has on file:
 * prescriptions written for them, and documents (X-rays, reports) attached
 * to their record. Both are server-rendered — the download links go through
 * `/api/documents/[id]`, which checks the file really belongs to them.
 */
export function PatientRecordsCard({ prescriptions, documents }: PatientRecordsCardProps) {
  if (prescriptions.length === 0 && documents.length === 0) {
    return (
      <EmptyState
        icon={PrescriptionIcon}
        title="No prescriptions or records yet"
        description="Prescriptions and any X-rays or reports from your care team will appear here."
      />
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {prescriptions.length > 0 && (
        <ul className="flex flex-col gap-2">
          {prescriptions.map((rx, i) => (
            <li
              key={rx.id}
              className={cn(ROW_CLASSES, rx.status !== "ACTIVE" && "opacity-70", STAGGER[i] ?? "stagger-5")}
            >
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-info-bg text-[var(--color-brand-blue-text)]">
                <Pill className="h-4 w-4" aria-hidden="true" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-text-primary">
                  {rx.medication} <span className="text-text-secondary">· {rx.dosage}</span>
                </p>
                <p className="truncate text-xs text-text-secondary">
                  {rx.instructions || rx.quantity || "As directed"}
                </p>
              </div>
              {rx.status === "ACTIVE" ? (
                <Badge tone="success" className="shrink-0">
                  Active
                </Badge>
              ) : (
                <Badge tone="neutral" className="shrink-0">
                  {rx.status === "COMPLETED" ? "Finished" : "Stopped"}
                </Badge>
              )}
            </li>
          ))}
        </ul>
      )}

      {documents.length > 0 && (
        <div className="flex flex-col gap-2">
          <p className="text-xs font-medium uppercase tracking-wide text-text-secondary">
            Records &amp; images
          </p>
          <ul className="flex flex-col gap-2">
            {documents.map((doc, i) => {
              const Icon = doc.mimeType.startsWith("image/") ? ImageIcon : FileText;
              return (
                <li key={doc.id} className={cn(ROW_CLASSES, STAGGER[i] ?? "stagger-5")}>
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-surface-muted text-text-secondary">
                    <Icon className="h-4 w-4" aria-hidden="true" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <a
                      href={`/api/documents/${doc.id}`}
                      target="_blank"
                      rel="noreferrer"
                      className="block truncate text-sm font-medium text-text-primary transition-colors duration-200 ease-out hover:text-[var(--color-brand-blue-text)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-brand-blue)] rounded-[var(--radius-sm)]"
                    >
                      {doc.title}
                    </a>
                    <p className="truncate text-xs text-text-secondary">
                      {formatSize(doc.sizeBytes)} ·{" "}
                      {doc.uploadedAt.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                    </p>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}
