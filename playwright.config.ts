import { defineConfig, devices } from "@playwright/test";

/**
 * Playwright E2E config.
 *
 * COVERAGE SCOPE — read before adding tests here or assuming more is
 * covered than actually is: there is no live PostgreSQL connection in this
 * environment (see project README/task context). `getCurrentSession()` and
 * every Server Action that touches the database fail closed (treated as
 * "unauthenticated" / "service unavailable") rather than throwing, so the
 * app itself stays usable, but nothing that requires a successful DB write
 * or read can be genuinely exercised end-to-end yet. That means:
 *
 *   - Login CANNOT be tested to a successful, authenticated outcome — the
 *     `login` Server Action's password lookup requires `prisma.user.findUnique`
 *     against a real database, which is unreachable here.
 *   - Portal-specific authenticated workflows (Dentist/Hygienist/
 *     Receptionist/Patient dashboards, RBAC enforcement against a real
 *     signed-in user's role) are untested by this suite for the same reason.
 *   - `/api/health`'s "database: ok" happy path is untestable here; only the
 *     "database: unreachable" / "status: degraded" path (the actual current
 *     state of this environment) is exercised.
 *
 * What IS covered, because none of it needs the database: unauthenticated
 * redirect behavior (middleware's cookie-presence gate), the login/
 * forgot-password/reset-password pages' rendering + client-side validation,
 * security headers on every response, and basic responsive layout.
 *
 * FOLLOW-UP once Postgres is provisioned and `prisma migrate deploy` +
 * `prisma db seed` have been run: add authenticated-flow E2E tests (real
 * login with the seeded dev users documented in `.env.example`, portal
 * dashboards rendering real data, RBAC enforcement redirecting a
 * wrong-role authenticated user, session expiry/logout).
 */

const PORT = Number(process.env.PLAYWRIGHT_PORT ?? 3311);
const BASE_URL = process.env.PLAYWRIGHT_BASE_URL ?? `http://127.0.0.1:${PORT}`;

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: "list",
  use: {
    baseURL: BASE_URL,
    trace: "on-first-retry",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  // Builds and starts a production server on a port that won't collide with
  // any dev server that may already be running (see task context: port 3000
  // may be occupied by an unrelated process). `reuseExistingServer` is false
  // so CI/local runs always talk to a server started from this exact build.
  webServer: {
    command: `npm run build && npm run start -- -p ${PORT}`,
    url: BASE_URL,
    reuseExistingServer: false,
    timeout: 180_000,
    env: {
      // No real DATABASE_URL is available in this environment. `getEnv()`
      // requires SOME non-empty string to pass its Zod schema even though
      // nothing here successfully connects — every DB-touching code path
      // (session lookup, health check's SELECT 1) fails closed/degrades
      // rather than being reached with a working connection. This matches
      // the real deployment shape (env var present, DB unreachable) rather
      // than exercising the "env var missing entirely" code path, which is
      // already covered by the Vitest env.test.ts suite.
      DATABASE_URL: "postgresql://postgres:postgres@127.0.0.1:5432/purity_e2e_unreachable",
      NODE_ENV: "production",
    },
  },
});
