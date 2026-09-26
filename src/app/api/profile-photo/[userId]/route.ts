import { NextResponse } from "next/server";
import { requireSession, AuthorizationError } from "@/lib/auth/authorize";
import { prisma } from "@/lib/prisma";

/**
 * Streams an uploaded profile photo.
 *
 * Photos are stored on the `User` row (see `actions/update-profile-photo.ts`),
 * so they need a route to be served from. Readable by any signed-in member of
 * the same organisation — these are the faces already shown in the top bar,
 * the team list and every appointment card, so the photo is no more sensitive
 * than the name beside it. The organisation scope still matters: it stops one
 * tenant enumerating another's staff by id.
 *
 * Route Handlers are directly invocable, so the session check is repeated here
 * rather than left to middleware — same reasoning as the documents route.
 */
export async function GET(_request: Request, { params }: { params: Promise<{ userId: string }> }) {
  const { userId } = await params;

  let session;
  try {
    session = await requireSession();
  } catch (error) {
    const status = error instanceof AuthorizationError && error.code === "FORBIDDEN" ? 403 : 401;
    return NextResponse.json({ error: "Not authorised." }, { status });
  }

  const user = await prisma.user.findFirst({
    where: { id: userId, organizationId: session.user.organizationId },
    select: { photoData: true, photoMimeType: true },
  });

  if (!user?.photoData || !user.photoMimeType) {
    return NextResponse.json({ error: "Not found." }, { status: 404 });
  }

  return new NextResponse(new Uint8Array(user.photoData), {
    headers: {
      "Content-Type": user.photoMimeType,
      "Content-Length": String(user.photoData.length),
      // The URL carries a `?v=` stamp that changes on every upload, so the
      // bytes at a given URL never change and can be cached hard — but only
      // by the viewer's own browser, never a shared proxy.
      "Cache-Control": "private, max-age=31536000, immutable",
      "Content-Security-Policy": "default-src 'none'; sandbox",
    },
  });
}
