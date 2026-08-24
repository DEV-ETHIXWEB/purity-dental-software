import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * Liveness/readiness probe. Always returns 200 with `status: "ok"` when the
 * Next.js server itself is up. Attempts a trivial `SELECT 1` against
 * Postgres to report DB connectivity too, but a DB failure degrades the
 * response to `status: "degraded"` rather than throwing/500ing — this
 * route must stay useful (and must not leak connection strings, stack
 * traces, or any other internal detail) even in this project's current
 * state, where no live database is connected yet.
 */
export async function GET() {
  let database: "ok" | "unreachable" = "unreachable";

  try {
    await prisma.$queryRaw`SELECT 1`;
    database = "ok";
  } catch {
    // Deliberately swallow the error detail — never return connection
    // strings, stack traces, or driver error messages to a caller.
    database = "unreachable";
  }

  const status = database === "ok" ? "ok" : "degraded";

  return NextResponse.json(
    {
      status,
      database,
      timestamp: new Date().toISOString(),
    },
    { status: 200 },
  );
}
