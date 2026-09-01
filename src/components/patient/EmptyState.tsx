import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: ReactNode;
}

/** Warm, brief empty state used across the Patient portal (no upcoming visits, no messages yet, etc). */
export function EmptyState({ icon: Icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-[var(--radius-xl)] border border-dashed border-border-strong bg-surface-muted px-6 py-10 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-surface text-[var(--color-brand-blue-text)]">
        <Icon className="h-6 w-6" aria-hidden="true" />
      </div>
      <div>
        <p className="text-sm font-semibold text-text-primary">{title}</p>
        <p className="mt-1 max-w-sm text-sm text-text-secondary">{description}</p>
      </div>
      {action}
    </div>
  );
}
