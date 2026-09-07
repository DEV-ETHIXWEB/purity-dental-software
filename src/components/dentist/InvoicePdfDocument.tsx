import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";
import { formatCentsAsCurrency, invoiceNumber } from "@/lib/billing-format";
import { patientFullName, patientAge } from "@/lib/patient-format";
import type { InvoiceWithProvider } from "@/lib/data/billing";

const styles = StyleSheet.create({
  page: { padding: 40, fontSize: 10, fontFamily: "Helvetica", color: "#111827" },
  header: { flexDirection: "row", justifyContent: "space-between", marginBottom: 24 },
  clinicName: { fontSize: 18, fontWeight: 700, marginBottom: 4 },
  invoiceNumber: { fontSize: 12, color: "#6b7280" },
  metaRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 2 },
  metaLabel: { color: "#6b7280" },
  section: { marginBottom: 16 },
  sectionLabel: { color: "#6b7280", marginBottom: 2 },
  tableHeaderRow: {
    flexDirection: "row",
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: "#111827",
    fontWeight: 700,
  },
  tableRow: {
    flexDirection: "row",
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
  },
  colDescription: { flex: 3 },
  colTooth: { flex: 1.6 },
  colQty: { flex: 0.6, textAlign: "right" },
  colAmount: { flex: 1, textAlign: "right" },
  totalsBlock: { marginTop: 16, alignSelf: "flex-end", width: 220 },
  totalsRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 4 },
  totalDueRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 6,
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: "#111827",
  },
  totalDueLabel: { fontWeight: 700 },
  totalDueValue: { fontWeight: 700 },
});

/**
 * Server-only PDF template for the invoice detail page's "Download PDF"
 * button — rendered to a buffer in `[invoiceId]/pdf/route.ts` via
 * `@react-pdf/renderer`'s `renderToBuffer`, entirely outside the app's CSP
 * (this never runs in a browser). Mirrors the same Subtotal/Insurance
 * Adjustment/Tax/Total Due breakdown shown on the detail page itself, so the
 * two never disagree.
 */
export function InvoicePdfDocument({ invoice }: { invoice: InvoiceWithProvider }) {
  const subtotalCents = invoice.lineItems.reduce((sum, li) => sum + li.quantity * li.unitPriceCents, 0);

  return (
    <Document title={invoiceNumber(invoice)}>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <View>
            <Text style={styles.clinicName}>Purity Dental Clinic</Text>
            <Text style={styles.invoiceNumber}>Invoice {invoiceNumber(invoice)}</Text>
          </View>
          <View>
            <View style={styles.metaRow}>
              <Text style={styles.metaLabel}>Status: </Text>
              <Text>{invoice.status}</Text>
            </View>
            <View style={styles.metaRow}>
              <Text style={styles.metaLabel}>Issued: </Text>
              <Text>{invoice.issuedAt.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</Text>
            </View>
            <View style={styles.metaRow}>
              <Text style={styles.metaLabel}>Due: </Text>
              <Text>{invoice.dueAt.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Billed to</Text>
          <Text>
            {patientFullName(invoice.patient)} · Age {patientAge(invoice.patient)}
          </Text>
          {invoice.provider && (
            <Text style={{ marginTop: 4 }}>Treating Provider: {invoice.provider.name}</Text>
          )}
        </View>

        <View>
          <View style={styles.tableHeaderRow}>
            <Text style={styles.colDescription}>Description</Text>
            <Text style={styles.colTooth}>Tooth / Quadrant</Text>
            <Text style={styles.colQty}>Qty</Text>
            <Text style={styles.colAmount}>Amount</Text>
          </View>
          {invoice.lineItems.map((item) => (
            <View style={styles.tableRow} key={item.id}>
              <Text style={styles.colDescription}>{item.description}</Text>
              <Text style={styles.colTooth}>{[item.tooth, item.quadrant].filter(Boolean).join(" · ") || "—"}</Text>
              <Text style={styles.colQty}>{item.quantity}</Text>
              <Text style={styles.colAmount}>{formatCentsAsCurrency(item.unitPriceCents * item.quantity)}</Text>
            </View>
          ))}
        </View>

        <View style={styles.totalsBlock}>
          <View style={styles.totalsRow}>
            <Text>Subtotal</Text>
            <Text>{formatCentsAsCurrency(subtotalCents)}</Text>
          </View>
          {invoice.insuranceAdjustmentCents > 0 && (
            <View style={styles.totalsRow}>
              <Text>Insurance Adjustment</Text>
              <Text>-{formatCentsAsCurrency(invoice.insuranceAdjustmentCents)}</Text>
            </View>
          )}
          <View style={styles.totalsRow}>
            <Text>Tax</Text>
            <Text>{formatCentsAsCurrency(invoice.taxCents)}</Text>
          </View>
          <View style={styles.totalDueRow}>
            <Text style={styles.totalDueLabel}>Total Due</Text>
            <Text style={styles.totalDueValue}>{formatCentsAsCurrency(invoice.totalCents)}</Text>
          </View>
        </View>
      </Page>
    </Document>
  );
}
