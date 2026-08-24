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
import type { SampleTreatmentPlanItem, TreatmentPlanStatus } from "@/lib/sample-data";

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

export function TreatmentPlanTable({ items }: { items: SampleTreatmentPlanItem[] }) {
  if (items.length === 0) {
    return <p className="text-sm text-text-secondary">No treatment plan items on file.</p>;
  }

  return (
    <TableContainer>
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
  );
}
