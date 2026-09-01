import { Badge } from "@/components/ui/Badge";
import type { SampleTreatmentPlanItem } from "@/lib/sample-data";

// Universal numbering system, upper arch left-to-right then lower arch right-to-left.
const UPPER_TEETH = Array.from({ length: 16 }, (_, i) => i + 1);
const LOWER_TEETH = Array.from({ length: 16 }, (_, i) => 32 - i);

function statusForTooth(items: SampleTreatmentPlanItem[], toothNumber: number) {
  return items.find((t) => t.tooth === `#${toothNumber}`) ?? null;
}

function ToothRow({
  teeth,
  items,
}: {
  teeth: number[];
  items: SampleTreatmentPlanItem[];
}) {
  return (
    <div className="flex flex-wrap justify-center gap-1.5">
      {teeth.map((num) => {
        const item = statusForTooth(items, num);
        const hasPlan = !!item;
        return (
          <div
            key={num}
            title={item ? `#${num}: ${item.procedure} (${item.status})` : `#${num}: no treatment planned`}
            className={`flex h-9 w-9 flex-col items-center justify-center rounded-[var(--radius-sm)] border text-[10px] font-medium ${
              hasPlan
                ? "border-[var(--color-brand-blue)] bg-info-bg text-[var(--color-brand-blue-text)]"
                : "border-border bg-surface-muted text-text-secondary"
            }`}
          >
            {num}
          </div>
        );
      })}
    </div>
  );
}

/** Simple tooth-numbering grid; teeth with an open treatment-plan item are highlighted. */
export function ToothChart({ items }: { items: SampleTreatmentPlanItem[] }) {
  return (
    <div className="flex flex-col items-center gap-4">
      <ToothRow teeth={UPPER_TEETH} items={items} />
      <div className="h-px w-full max-w-md bg-border" />
      <ToothRow teeth={LOWER_TEETH} items={items} />
      <div className="mt-2 flex items-center gap-2">
        <Badge tone="brand-blue">Has treatment plan item</Badge>
      </div>
    </div>
  );
}
