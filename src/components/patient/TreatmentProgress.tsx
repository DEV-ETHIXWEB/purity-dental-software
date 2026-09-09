import { Check } from "lucide-react";
import { cn } from "@/lib/cn";
import type { TreatmentPlanItem } from "@/generated/prisma/client";

const STEP_ORDER: Record<TreatmentPlanItem["status"], number> = {
  COMPLETED: 1,
  ACTIVE: 2,
  PLANNED: 3,
  DECLINED: 4,
};

/**
 * Friendly step-progress visual for a patient's treatment plan. Derives its
 * steps narratively from the PLANNED/ACTIVE/COMPLETED items in
 * `treatmentPlanForPatient()` — completed items render as done, the active
 * item as current, planned items as upcoming. Declined items are excluded
 * from the visual (nothing to show progress toward).
 *
 * Laid out horizontally: a plan is a short journey and reads better as one
 * left-to-right run than as a tall vertical list that pushes everything
 * below it off a phone screen. The row scrolls sideways rather than
 * wrapping, so four steps with long procedure names stay on one line
 * instead of collapsing into an unreadable grid.
 */
export function TreatmentProgress({ items }: { items: TreatmentPlanItem[] }) {
  const steps = [...items]
    .filter((i) => i.status !== "DECLINED")
    .sort((a, b) => STEP_ORDER[a.status] - STEP_ORDER[b.status]);

  if (steps.length === 0) return null;

  const activeIndex = steps.findIndex((s) => s.status === "ACTIVE");
  const completedCount = steps.filter((s) => s.status === "COMPLETED").length;
  const currentStepNumber = activeIndex >= 0 ? activeIndex + 1 : completedCount;

  return (
    <div>
      <ol className="flex items-start overflow-x-auto pb-1">
        {steps.map((step, index) => {
          const isDone = step.status === "COMPLETED";
          const isCurrent = step.status === "ACTIVE";
          const isLast = index === steps.length - 1;
          // The connector belongs to the step on its left, and is "filled"
          // only once that step is behind the patient.
          const connectorDone = isDone;

          return (
            <li
              key={step.id}
              className="flex min-w-0 flex-1 basis-0 flex-col items-center gap-2"
            >
              <div className="flex w-full items-center">
                {/* Half-width spacers keep every marker centred over its own
                    label, including the first and last. */}
                <span
                  className={cn(
                    "h-0.5 flex-1 rounded-full",
                    index === 0 ? "bg-transparent" : steps[index - 1].status === "COMPLETED" ? "bg-success" : "bg-border-strong",
                  )}
                  aria-hidden="true"
                />
                <span
                  className={cn(
                    "animate-pop-in flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 text-xs font-semibold transition-colors duration-300 ease-out",
                    isDone && "border-success bg-success text-white",
                    isCurrent &&
                      "border-[var(--color-brand-blue)] bg-[var(--color-brand-blue)] text-white ring-4 ring-[color-mix(in_srgb,var(--color-brand-blue)_18%,transparent)]",
                    !isDone && !isCurrent && "border-border-strong bg-surface text-text-secondary",
                  )}
                  aria-hidden="true"
                >
                  {isDone ? <Check className="h-4 w-4" /> : index + 1}
                </span>
                <span
                  className={cn(
                    "h-0.5 flex-1 rounded-full",
                    isLast ? "bg-transparent" : connectorDone ? "bg-success" : "bg-border-strong",
                  )}
                  aria-hidden="true"
                />
              </div>

              <div className="min-w-0 px-1 text-center">
                <p
                  className={cn(
                    "truncate text-[11px] font-medium leading-tight",
                    isCurrent ? "text-text-primary" : "text-text-secondary",
                  )}
                  title={step.procedure}
                >
                  {step.procedure}
                </p>
                {step.tooth && (
                  <p className="truncate text-[10px] text-text-secondary">tooth {step.tooth}</p>
                )}
              </div>
            </li>
          );
        })}
      </ol>
      <p className="sr-only">
        Step {currentStepNumber} of {steps.length} in your treatment plan.
      </p>
    </div>
  );
}
