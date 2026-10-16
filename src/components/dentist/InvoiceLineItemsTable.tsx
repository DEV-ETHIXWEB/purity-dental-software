import {
  TableContainer,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableHeaderCell,
  TableCell,
} from "@/components/ui/Table";
import { formatCentsAsCurrency } from "@/lib/billing-format";
import type { InvoiceLineItem } from "@/generated/prisma/client";

/**
 * Which identifier the second column carries.
 *
 * The three invoice detail pages disagreed on this: the Dentist view shows
 * the tooth and quadrant a line item applies to, while the Hygienist and
 * Front Desk views show the procedure code. That was the only difference
 * between three otherwise identical copies of this markup, so it is the one
 * thing the shared component takes as a prop.
 */
export type InvoiceLineItemsColumn = "tooth" | "code";

function secondaryLabel(column: InvoiceLineItemsColumn): string {
  return column === "tooth" ? "Tooth / Quadrant" : "Code";
}

function secondaryValue(item: InvoiceLineItem, column: InvoiceLineItemsColumn): string {
  if (column === "code") return item.procedureCode ?? "—";
  return [item.tooth, item.quadrant].filter(Boolean).join(" · ") || "—";
}

/**
 * Invoice line items — table on desktop, stacked cards on a phone.
 *
 * Extracted from the three invoice detail pages, which each carried their
 * own copy. Beyond the duplication, the shared `Table` primitive sets
 * `min-w-[640px]`: right for five columns, but on a 375px screen it forced
 * the billing document to be read by dragging it sideways inside its card.
 * The cards carry the same five fields with no scrolling.
 */
export function InvoiceLineItemsTable({
  items,
  column,
}: {
  items: InvoiceLineItem[];
  column: InvoiceLineItemsColumn;
}) {
  if (items.length === 0) {
    return <p className="text-sm text-text-secondary">No line items on this invoice.</p>;
  }

  return (
    <div className="@container">
      <TableContainer className="hidden @2xl:block">
        <Table>
          <TableHead>
            <TableRow>
              <TableHeaderCell>Description</TableHeaderCell>
              <TableHeaderCell>{secondaryLabel(column)}</TableHeaderCell>
              <TableHeaderCell>Qty</TableHeaderCell>
              <TableHeaderCell>Unit Price</TableHeaderCell>
              <TableHeaderCell>Amount</TableHeaderCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {items.map((item) => (
              <TableRow key={item.id}>
                <TableCell className="text-text-primary">{item.description}</TableCell>
                <TableCell className="text-text-secondary">
                  {secondaryValue(item, column)}
                </TableCell>
                <TableCell className="text-text-secondary">{item.quantity}</TableCell>
                <TableCell className="text-text-secondary">
                  {formatCentsAsCurrency(item.unitPriceCents)}
                </TableCell>
                <TableCell className="font-medium text-text-primary">
                  {formatCentsAsCurrency(item.unitPriceCents * item.quantity)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <ul className="flex flex-col gap-3 @2xl:hidden">
        {items.map((item) => (
          <li
            key={item.id}
            className="rounded-[var(--radius-lg)] border border-border bg-surface p-3 shadow-card"
          >
            <div className="flex items-start justify-between gap-3">
              <p className="min-w-0 text-sm font-medium text-text-primary">{item.description}</p>
              {/* The line total leads on mobile — it is what someone reading
                  a bill on a phone is looking for. */}
              <p className="shrink-0 text-sm font-medium tabular-nums text-text-primary">
                {formatCentsAsCurrency(item.unitPriceCents * item.quantity)}
              </p>
            </div>
            <p className="mt-1 text-xs text-text-secondary">
              {secondaryLabel(column)}: {secondaryValue(item, column)}
            </p>
            <p className="mt-0.5 text-xs text-text-secondary">
              {item.quantity} × {formatCentsAsCurrency(item.unitPriceCents)}
            </p>
          </li>
        ))}
      </ul>
    </div>
  );
}
