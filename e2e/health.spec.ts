import { test, expect } from "@playwright/test";

/**
 * `/api/health` — in this environment there is no live Postgres connection,
 * so only the "degraded" path (`SELECT 1` fails) is reachable/testable. The
 * "database: ok" happy path is a follow-up once Postgres is provisioned.
 */
test.describe("/api/health", () => {
  test("returns 200 with a degraded status when the database is unreachable", async ({ request }) => {
    const response = await request.get("/api/health");
    expect(response.status()).toBe(200);

    const body = await response.json();
    expect(body).toMatchObject({
      status: "degraded",
      database: "unreachable",
    });
    expect(typeof body.timestamp).toBe("string");
    expect(new Date(body.timestamp).toString()).not.toBe("Invalid Date");
  });

  test("response body has exactly the documented shape — no extra leaked fields", async ({ request }) => {
    const response = await request.get("/api/health");
    const body = await response.json();
    expect(Object.keys(body).sort()).toEqual(["database", "status", "timestamp"]);
  });

  test("response body contains no stack trace, connection string, or driver error detail", async ({ request }) => {
    const response = await request.get("/api/health");
    const raw = await response.text();

    // No leaked DB credentials/host from DATABASE_URL.
    expect(raw).not.toMatch(/postgres(ql)?:\/\//i);
    // No stack-trace-shaped content.
    expect(raw).not.toMatch(/at\s+\S+\s+\(.*:\d+:\d+\)/);
    expect(raw.toLowerCase()).not.toContain("stack");
    // No raw driver/error class names that would hint at internals.
    expect(raw).not.toMatch(/PrismaClientInitializationError|ECONNREFUSED|password authentication/i);
  });

  test("content-type is application/json", async ({ request }) => {
    const response = await request.get("/api/health");
    expect(response.headers()["content-type"]).toContain("application/json");
  });
});
