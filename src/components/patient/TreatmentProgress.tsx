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
 */
export function TreatmentProgress({ items }: { items: TreatmentPlanItem[] }) {
  const steps = [...items]
    .filter((i) => i.status !== "DECLINED")
    .sort((a, b) => STEP_ORDER[a.status] - STEP_ORDER[b.status]);

  if (steps.length === 0) return null;

  const activeIndex = steps.findIndex((s) => s.status === "ACTIVE");
  const currentStepNumber = activeIndex >= 0 ? activeIndex + 1 : steps.filter((s) => s.status === "COMPLETED").length;

  return (
    <div>
      <ol className="flex flex-col gap-0">
        {steps.map((step, index) => {
          const isDone = step.status === "COMPLETED";
          const isCurrent = step.status === "ACTIVE";
          const isLast = index === steps.length - 1;

          return (
            <li key={step.id} className="flex gap-3">
              <div className="flex flex-col items-center">
                <span
                  className={cn(
                    "flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-2 text-sm font-semibold",
                    isDone && "border-success bg-success text-white",
                    isCurrent && "border-[var(--color-brand-blue)] bg-[var(--color-brand-blue)] text-white",
                    !isDone && !isCurrent && "border-border-strong bg-surface text-text-secondary",
                  )}
                  aria-hidden="true"
                >
                  {isDone ? <Check className="h-4 w-4" /> : index + 1}
                </span>
                {!isLast && (
                  <span
                    className={cn(
                      "w-0.5 flex-1 min-h-8",
                      isDone ? "bg-success" : "bg-border-strong",
                    )}
                    aria-hidden="true"
                  />
                )}
              </div>
              <div className={cn("pb-6", isLast && "pb-0")}>
                <p
                  className={cn(
                    "text-sm font-semibold",
                    isCurrent ? "text-text-primary" : "text-text-primary/90",
                  )}
                >
                  {step.procedure}
                  {step.tooth ? ` — tooth ${step.tooth}` : ""}
                </p>
                <p className="text-xs text-text-secondary">
                  {isDone ? "Completed" : isCurrent ? "In progress" : "Coming up"}
                </p>
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
