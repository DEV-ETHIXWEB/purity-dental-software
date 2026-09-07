import { Card } from "@/components/ui/Card";
import { Badge, type BadgeTone } from "@/components/ui/Badge";
import { RootCanalIconFilled } from "@/components/ui/icons/purity-icons";
import type { TreatmentPlanItem, TreatmentPlanStatus } from "@/generated/prisma/client";

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
export function TreatmentPlanCard({ item }: { item: TreatmentPlanItem }) {
  return (
    <Card className="flex flex-col gap-2 p-5">
      <div className="flex items-start justify-between gap-3">
        <span className="flex items-start gap-2.5">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-surface-muted">
            <RootCanalIconFilled className="h-4 w-4" aria-hidden="true" />
          </span>
          <p className="pt-1 text-sm font-semibold text-text-primary">{item.procedure}</p>
        </span>
        <Badge tone={STATUS_TONE[item.status]}>{STATUS_LABEL[item.status]}</Badge>
      </div>
      <p className="text-sm text-text-secondary">
        Tooth {item.tooth} · {item.quadrant}
      </p>
      {item.recallInterval && (
        <p className="text-xs text-text-secondary">Recommended check-in: every {item.recallInterval}</p>
      )}
    </Card>
  );
}
