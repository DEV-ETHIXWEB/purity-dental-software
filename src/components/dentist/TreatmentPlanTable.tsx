import {
  TableContainer,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableHeaderCell,
  TableCell,
} from "@/components/ui/Table";
import { Badge, type BadgeTone } from "@/components/ui/Badge";
import type { TreatmentPlanItem, TreatmentPlanStatus } from "@/generated/prisma/client";

const STATUS_TONE: Record<TreatmentPlanStatus, BadgeTone> = {
  PLANNED: "brand-blue",
  ACTIVE: "warning",
  COMPLETED: "success",
  DECLINED: "neutral",
};

const STATUS_LABEL: Record<TreatmentPlanStatus, string> = {
  PLANNED: "Planned",
  ACTIVE: "Active",
  COMPLETED: "Completed",
  DECLINED: "Declined",
};

export function TreatmentPlanTable({ items }: { items: TreatmentPlanItem[] }) {
  if (items.length === 0) {
    return <p className="text-sm text-text-secondary">No treatment plan items on file.</p>;
  }

  return (
    <>
      {/*
       * Table on desktop, stacked cards on a phone — the same split
       * `PatientsTable` and `StaffTable` use.
       *
       * The shared `Table` primitive carries `min-w-[640px]`, which is right
       * for a four-column grid but forces a sideways scroll inside the card
       * at 375px. Cards carry the same four fields without it.
       */}
      <TableContainer className="hidden md:block">
        <Table>
          <TableHead>
            <TableRow>
              <TableHeaderCell>Tooth / Quadrant</TableHeaderCell>
              <TableHeaderCell>Procedure</TableHeaderCell>
              <TableHeaderCell>Status</TableHeaderCell>
              <TableHeaderCell>Recall Interval</TableHeaderCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {items.map((item) => (
              <TableRow key={item.id}>
                <TableCell>
                  <span className="font-medium text-text-primary">{item.tooth}</span>
                  <span className="block text-xs text-text-secondary">{item.quadrant}</span>
                </TableCell>
                <TableCell className="text-text-primary">{item.procedure}</TableCell>
                <TableCell>
                  <Badge tone={STATUS_TONE[item.status]}>{STATUS_LABEL[item.status]}</Badge>
                </TableCell>
                <TableCell className="text-text-secondary">{item.recallInterval}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <ul className="flex flex-col gap-3 md:hidden">
        {items.map((item) => (
          <li
            key={item.id}
            className="rounded-[var(--radius-lg)] border border-border bg-surface p-3 shadow-card"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-text-primary">{item.tooth}</p>
                <p className="truncate text-xs text-text-secondary">{item.quadrant}</p>
              </div>
              <Badge tone={STATUS_TONE[item.status]} className="shrink-0">
                {STATUS_LABEL[item.status]}
              </Badge>
            </div>
            <p className="mt-2 text-sm text-text-primary">{item.procedure}</p>
            <p className="mt-0.5 text-xs text-text-secondary">
              Recall: {item.recallInterval}
            </p>
          </li>
        ))}
      </ul>
    </>
  );
}
