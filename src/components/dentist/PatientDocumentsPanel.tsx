"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { FileText, ImageIcon, Loader2, Paperclip, Trash2, Upload } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { cn } from "@/lib/cn";
import { uploadPatientDocument, deletePatientDocument } from "@/lib/actions/clinical-records";
import type { DocumentSummary } from "@/lib/data/clinical-records";
import type { DocumentKind } from "@/generated/prisma/client";

export interface PatientDocumentsPanelProps {
  patientId: string;
  documents: DocumentSummary[];
  /** Receptionists manage records too, so this panel is shown to all staff — see update-patient.ts's permission legend. */
  canManage?: boolean;
}

const KINDS: { value: DocumentKind; label: string }[] = [
  { value: "XRAY", label: "X-ray" },
  { value: "REPORT", label: "Report" },
  { value: "REFERRAL", label: "Referral" },
  { value: "OTHER", label: "Other" },
];

const KIND_TONE: Record<DocumentKind, "brand-blue" | "brand-teal" | "info" | "neutral"> = {
  XRAY: "brand-blue",
  REPORT: "brand-teal",
  REFERRAL: "info",
  OTHER: "neutral",
};

const STAGGER = ["stagger-0", "stagger-1", "stagger-2", "stagger-3", "stagger-4", "stagger-5"];

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

const SELECT_CLASSES =
  "h-10 rounded-[var(--radius-md)] border border-border bg-surface px-3 text-sm text-text-primary transition-colors duration-200 ease-out hover:border-border-strong focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-brand-blue)]";

/**
 * X-rays, reports and referral letters on a patient record. Files are stored
 * in the database (no blob store is configured) and streamed back by
 * `/api/documents/[id]`, which re-checks who's asking — so a document link is
 * not a public URL.
 */
export function PatientDocumentsPanel({ patientId, documents, canManage = true }: PatientDocumentsPanelProps) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [removingId, setRemovingId] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    setBusy(true);
    setError(null);

    const formData = new FormData(event.currentTarget);
    formData.set("patientId", patientId);
    const result = await uploadPatientDocument(formData);
    setBusy(false);

    if (result.ok) {
      formRef.current?.reset();
      setFileName(null);
      router.refresh();
    } else {
      setError(result.error ?? "Couldn't upload that document.");
    }
  }

  async function handleDelete(id: string) {
    setRemovingId(id);
    setError(null);
    const result = await deletePatientDocument(id);
    setRemovingId(null);
    if (result.ok) router.refresh();
    else setError(result.error ?? "Couldn't remove that document.");
  }

  return (
    <section className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-[15px] font-semibold tracking-tight text-text-primary">
          Documents
          <span className="ml-2 text-sm font-normal text-text-secondary">
            X-rays, reports and referrals
          </span>
        </h3>
        <span className="text-xs text-text-secondary">{documents.length} on file</span>
      </div>

      {canManage && (
        <form
          ref={formRef}
          onSubmit={handleSubmit}
          className="flex flex-col gap-3 rounded-[var(--radius-lg)] border border-dashed border-border-strong bg-surface-muted/50 p-4 transition-colors duration-200 ease-out hover:border-[var(--color-brand-blue)]/50"
        >
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-[1fr_auto]">
            <Input
              label="Title"
              name="title"
              placeholder="e.g. Bitewing X-ray — upper right"
              required
              className="transition-colors duration-200 ease-out hover:border-border-strong focus:border-[var(--color-brand-blue)]"
            />
            <div className="flex flex-col gap-1.5">
              <label htmlFor={`kind-${patientId}`} className="text-sm font-medium text-text-primary">
                Type
              </label>
              <select id={`kind-${patientId}`} name="kind" defaultValue="XRAY" className={SELECT_CLASSES}>
                {KINDS.map((k) => (
                  <option key={k.value} value={k.value}>
                    {k.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* The native control is hidden but still the labelled input, so
                keyboard and screen-reader users get the real file picker. */}
            <label
              className={cn(
                "group/file inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-[var(--radius-lg)] border border-border bg-surface px-4 text-sm font-medium text-text-primary",
                "transition-all duration-200 ease-out hover:-translate-y-0.5 hover:border-border-strong hover:shadow-card active:scale-[0.98]",
                "focus-within:outline focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-[var(--color-brand-blue)]",
                "motion-reduce:hover:translate-y-0 motion-reduce:active:scale-100",
              )}
            >
              <Paperclip className="h-4 w-4 transition-transform duration-200 ease-out group-hover/file:-rotate-12" aria-hidden="true" />
              Choose file
              <input
                type="file"
                name="file"
                required
                accept="image/png,image/jpeg,image/webp,application/pdf"
                onChange={(e) => setFileName(e.target.files?.[0]?.name ?? null)}
                className="sr-only"
              />
            </label>
            {/* Full width on a phone: squeezed between the two buttons it
                collapsed to a couple of characters. */}
            <span className="order-last min-w-0 basis-full truncate text-sm text-text-secondary sm:order-none sm:flex-1 sm:basis-auto">
              {fileName ?? "PNG, JPEG, WebP or PDF · up to 5MB"}
            </span>
            <Button
              type="submit"
              disabled={busy}
              className="min-h-11 shrink-0 transition-all duration-200 ease-out hover:shadow-card-hover active:scale-[0.98] motion-reduce:active:scale-100"
            >
              {busy ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin motion-reduce:animate-none" aria-hidden="true" />
                  Uploading…
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4" aria-hidden="true" />
                  Upload
                </>
              )}
            </Button>
          </div>

          {error && (
            <p role="alert" className="animate-rise-in text-sm text-error">
              {error}
            </p>
          )}
        </form>
      )}

      {documents.length === 0 ? (
        <p className="rounded-[var(--radius-lg)] border border-dashed border-border py-8 text-center text-sm text-text-secondary">
          No documents on file yet.
        </p>
      ) : (
        <ul className="flex flex-col gap-2">
          {documents.map((doc, i) => {
            const isImage = doc.mimeType.startsWith("image/");
            const Icon = isImage ? ImageIcon : FileText;
            return (
              <li
                key={doc.id}
                className={cn(
                  "group/doc animate-rise-in flex items-center gap-3 rounded-[var(--radius-md)] border border-border bg-surface p-3",
                  "transition-all duration-200 ease-out hover:-translate-y-0.5 hover:border-border-strong hover:shadow-card motion-reduce:hover:translate-y-0",
                  STAGGER[i] ?? "stagger-5",
                )}
              >
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[var(--radius-md)] bg-surface-muted text-text-secondary transition-colors duration-200 ease-out group-hover/doc:text-[var(--color-brand-blue-text)]">
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
                    {formatSize(doc.sizeBytes)}
                    {doc.uploadedBy?.name ? ` · ${doc.uploadedBy.name}` : ""} ·{" "}
                    {doc.uploadedAt.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                  </p>
                </div>
                <Badge tone={KIND_TONE[doc.kind]} className="shrink-0">
                  {KINDS.find((k) => k.value === doc.kind)?.label ?? "Other"}
                </Badge>
                {canManage && (
                  <button
                    type="button"
                    onClick={() => handleDelete(doc.id)}
                    disabled={removingId === doc.id}
                    aria-label={`Remove ${doc.title}`}
                    className="shrink-0 rounded-[var(--radius-md)] p-2 text-text-secondary transition-colors duration-200 ease-out hover:bg-error-bg hover:text-error-text focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-brand-blue)] disabled:opacity-50"
                  >
                    {removingId === doc.id ? (
                      <Loader2 className="h-4 w-4 animate-spin motion-reduce:animate-none" aria-hidden="true" />
                    ) : (
                      <Trash2 className="h-4 w-4" aria-hidden="true" />
                    )}
                  </button>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
