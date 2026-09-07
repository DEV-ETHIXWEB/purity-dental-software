import { NextResponse } from "next/server";
import { renderToBuffer } from "@react-pdf/renderer";
import { requireRole } from "@/lib/auth/authorize";
import { getInvoiceById } from "@/lib/data/billing";
import { invoiceNumber } from "@/lib/billing-format";
import { InvoicePdfDocument } from "@/components/dentist/InvoicePdfDocument";

/**
 * Streams a real PDF for the invoice detail page's "Download PDF" button.
 * Generation happens entirely server-side (`@react-pdf/renderer`'s
 * `renderToBuffer`, not a browser), so it never touches the app's strict
 * CSP — the response is a binary download, not HTML/JS the policy applies
 * to. `InvoicePdfDocument` is called directly as a plain function (it has
 * no hooks) rather than via JSX/createElement, both to keep this a plain
 * `.ts` Route Handler file and because `renderToBuffer` is typed to accept
 * a `<Document>` element specifically — calling the function directly
 * returns exactly that, where wrapping it in `createElement` would instead
 * produce a generic component element `renderToBuffer`'s types reject.
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ invoiceId: string }> },
) {
  const session = await requireRole(["DENTIST", "ADMIN"]);
  const { invoiceId } = await params;
  const invoice = await getInvoiceById(session.user.organizationId, invoiceId);

  if (!invoice) {
    return new NextResponse("Invoice not found", { status: 404 });
  }

  const buffer = await renderToBuffer(InvoicePdfDocument({ invoice }));

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${invoiceNumber(invoice)}.pdf"`,
    },
  });
}
