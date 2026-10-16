import { NextResponse } from "next/server";
import { renderToBuffer } from "@react-pdf/renderer";
import { AuthorizationError, requirePermission } from "@/lib/auth/authorize";
import { getInvoiceById } from "@/lib/data/billing";
import { invoiceNumber } from "@/lib/billing-format";
import { InvoicePdfDocument } from "@/components/dentist/InvoicePdfDocument";
import { getPracticeDetails } from "@/lib/data/organization";
import { DEFAULT_CLINIC_TIMEZONE } from "@/lib/datetime";

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
  /*
   * Same grant as the invoice page this downloads from: a revoked
   * `billing.view` must not leave the PDF reachable by URL.
   *
   * Caught and mapped to a status rather than left to throw — an uncaught
   * `AuthorizationError` in a Route Handler is a 500, which reads as a
   * server fault instead of a refusal (the documents route does the same).
   */
  let session;
  try {
    session = await requirePermission("billing.view");
  } catch (error) {
    const status = error instanceof AuthorizationError && error.code === "FORBIDDEN" ? 403 : 401;
    return new NextResponse(status === 403 ? "Forbidden" : "Unauthorized", { status });
  }

  /*
   * The permission alone is not the whole old rule. This route was
   * Dentist/Admin-only, and `billing.view` is also held by hygienists and
   * the front desk, who have no PDF button — so checking only the
   * permission would have quietly opened the download to them.
   */
  if (session.user.role !== "DENTIST" && session.user.role !== "ADMIN") {
    return new NextResponse("Forbidden", { status: 403 });
  }

  const { invoiceId } = await params;
  const [invoice, practice] = await Promise.all([
    getInvoiceById(session.user.organizationId, invoiceId),
    getPracticeDetails(session.user.organizationId),
  ]);
  const timeZone = practice?.timezone ?? DEFAULT_CLINIC_TIMEZONE;

  if (!invoice) {
    return new NextResponse("Invoice not found", { status: 404 });
  }

  const buffer = await renderToBuffer(InvoicePdfDocument({
      invoice,
      timeZone,
      practice: {
        name: practice?.name ?? "Purity Dental Clinic",
        phone: practice?.phone ?? null,
        email: practice?.email ?? null,
        addressLine: practice?.addressLine ?? null,
      },
    }));

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${invoiceNumber(invoice)}.pdf"`,
    },
  });
}
