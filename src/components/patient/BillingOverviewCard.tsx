import { Card } from "@/components/ui/Card";
import { CreditCardIconFilled } from "@/components/ui/icons/purity-icons";
import { InsuranceIcon } from "@/components/ui/icons/purity-raster-icons";
import { formatCentsAsCurrency } from "@/lib/billing-format";
import { formatShortDate } from "./formatters";
import { cn } from "@/lib/cn";
import type { PatientBillingOverview } from "@/lib/data/billing";

/**
 * Maps a percentage onto one of the 5% step classes in globals.css.
 * A non-zero value never rounds down to an empty bar — 1% used should
 * still show a sliver, or the meter reads as "nothing claimed yet".
 */
function meterClass(pct: number) {
  const clamped = Math.min(100, Math.max(0, pct));
  const step = Math.round(clamped / 5) * 5;
  return `meter-fill-${clamped > 0 ? Math.max(5, step) : 0}`;
}

export function BillingOverviewCard({ overview }: { overview: PatientBillingOverview }) {
  const { amountDueCents, nextDueAt, hasOverdue, insurance } = overview;

  return (
    <Card className="animate-rise-in stagger-1 transition-shadow duration-300 ease-out hover:shadow-card-hover">
      <div className="grid grid-cols-1 divide-y divide-border sm:grid-cols-2 sm:divide-x sm:divide-y-0">
        <div className="flex items-start justify-between gap-3 p-4">
          <div className="min-w-0">
            <p className="text-sm font-medium text-text-secondary">Amount due</p>
            <p className="mt-1 text-2xl font-bold tracking-tight text-text-primary">
              {formatCentsAsCurrency(amountDueCents)}
            </p>
            <p
              className={cn(
                "mt-1 text-xs",
                hasOverdue && amountDueCents > 0 ? "font-medium text-error-text" : "text-text-secondary",
              )}
            >
              {amountDueCents === 0
                ? "You're all paid up"
                : nextDueAt
                  ? `${hasOverdue ? "Overdue since" : "Due on"} ${formatShortDate(nextDueAt)}`
                  : "No due date on file"}
            </p>
          </div>
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-surface-muted">
            <CreditCardIconFilled className="h-5 w-5" aria-hidden="true" />
          </span>
        </div>

        <div className="p-4">
          <div className="flex items-center gap-2">
            <InsuranceIcon className="h-4 w-4 shrink-0" aria-hidden="true" />
            <p className="text-sm font-medium text-text-secondary">Insurance coverage</p>
          </div>

          {insurance.remainingCents != null && insurance.usedPct != null ? (
            <>
              <p className="mt-1 text-2xl font-bold tracking-tight text-[var(--color-brand-blue-text)]">
                {formatCentsAsCurrency(insurance.remainingCents)}
              </p>
              <p className="mt-1 text-xs text-text-secondary">
                remaining this year of {formatCentsAsCurrency(insurance.annualMaxCents ?? 0)} benefit
              </p>
              {/* Width comes from a named step class, not an inline style —
                  the app's CSP drops inline styles (see globals.css). */}
              <div
                className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-surface-sunken"
                role="progressbar"
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={insurance.usedPct}
                aria-label="Annual insurance benefit used"
              >
                <div className={cn("meter-fill h-full rounded-full", meterClass(insurance.usedPct))} />
              </div>
              <p className="mt-1.5 text-xs text-text-secondary">{insurance.usedPct}% used</p>
            </>
          ) : (
            <>
              <p className="mt-1 text-2xl font-bold tracking-tight text-[var(--color-brand-blue-text)]">
                {formatCentsAsCurrency(insurance.usedCents)}
              </p>
              <p className="mt-1 text-xs text-text-secondary">
                {insurance.provider
                  ? `covered by ${insurance.provider} this year — no annual maximum on file`
                  : "covered this year. No insurance plan on file."}
              </p>
            </>
          )}
        </div>
      </div>
    </Card>
  );
}
