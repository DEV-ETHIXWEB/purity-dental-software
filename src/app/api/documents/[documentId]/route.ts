import { NextResponse } from "next/server";
import { requireSession, AuthorizationError } from "@/lib/auth/authorize";
import { getPatientForUser } from "@/lib/data/patients";
import { prisma } from "@/lib/prisma";

/**
 * Streams a patient document's bytes.
 *
 * One route rather than one per portal, because the authorisation rule is
 * the same everywhere and belongs in a single place: staff may read any
 * document in their own organisation; a PATIENT may read only documents
 * attached to their own record. The id alone is never enough — every query
 * is scoped by organisation, and the patient branch re-resolves the patient
 * from the session rather than trusting anything in the URL.
 *
 * Route Handlers are directly invocable, so this repeats the check rather
 * than leaning on middleware (see `lib/auth/authorize.ts`).
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ documentId: string }> },
) {
  const { documentId } = await params;

  let session;
  try {
    session = await requireSession();
  } catch (error) {
    const status = error instanceof AuthorizationError && error.code === "FORBIDDEN" ? 403 : 401;
    return NextResponse.json({ error: "Not authorised." }, { status });
  }

  const where =
    session.user.role === "PATIENT"
      ? await (async () => {
          const patient = await getPatientForUser(session.user.id);
          // No patient record means nothing of theirs to read.
          return patient
            ? { id: documentId, organizationId: session.user.organizationId, patientId: patient.id }
            : null;
        })()
      : { id: documentId, organizationId: session.user.organizationId };

  if (!where) return NextResponse.json({ error: "Not found." }, { status: 404 });

  const document = await prisma.document.findFirst({
    where,
    select: { data: true, mimeType: true, fileName: true },
  });
  if (!document) return NextResponse.json({ error: "Not found." }, { status: 404 });

  const body = new Uint8Array(document.data);
  return new NextResponse(body, {
    headers: {
      "Content-Type": document.mimeType,
      "Content-Length": String(body.byteLength),
      // `inline` so an X-ray or PDF opens in the browser tab rather than
      // forcing a download; the filename is still used if the user saves it.
      "Content-Disposition": `inline; filename="${encodeURIComponent(document.fileName)}"`,
      // Patient records must never sit in a shared cache.
      "Cache-Control": "private, no-store",
    },
  });
}
