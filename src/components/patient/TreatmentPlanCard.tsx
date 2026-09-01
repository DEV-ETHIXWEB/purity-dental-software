import { Card } from "@/components/ui/Card";
import { Badge, type BadgeTone } from "@/components/ui/Badge";
import type { SampleTreatmentPlanItem, TreatmentPlanStatus } from "@/lib/sample-data";

const STATUS_LABEL: Record<TreatmentPlanStatus, string> = {
  PLANNED: "Coming up",
  ACTIVE: "In progress",
  COMPLETED: "Completed",
  DECLINED: "Declined",
};

const STATUS_TONE: Record<TreatmentPlanStatus, BadgeTone> = {
  PLANNED: "info",
  ACTIVE: "brand-blue",
  COMPLETED: "success",
  DECLINED: "neutral",
};

/** Friendly card presentation of one treatment plan item — approachable, not a clinical table row. */
export function TreatmentPlanCard({ item }: { item: SampleTreatmentPlanItem }) {
  return (
    <Card className="flex flex-col gap-2 p-5">
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm font-semibold text-text-primary">{item.procedure}</p>
        <Badge tone={STATUS_TONE[item.status]}>{STATUS_LABEL[item.status]}</Badge>
      </div>
      <p className="text-sm text-text-secondary">
        Tooth {item.tooth} · {item.quadrant}
      </p>
      <p className="text-xs text-text-secondary">Recommended check-in: every {item.recallInterval}</p>
    </Card>
  );
}
