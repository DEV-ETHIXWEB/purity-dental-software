import { z } from "zod";

/**
 * Server-side environment validation.
 *
 * IMPORTANT: this module validates LAZILY (on first call to `getEnv()`),
 * not at import time. Next.js's build (`next build`) statically analyzes
 * and imports route modules while producing the build — if this module
 * threw at import time in an environment with no real `.env` (like this
 * sandbox, or a CI image building before secrets are injected), it would
 * fail the build for routes that merely import auth helpers, even though
 * those routes never actually need the DB/session secret until a real
 * request comes in. Validating lazily means `next build` succeeds, and the
 * app fails fast with a clear error the moment a request actually needs a
 * missing variable at runtime — not before.
 */

const envSchema = z.object({
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),
  // Used to derive additional keyed material if/when the session token
  // scheme needs it (e.g. HMAC-signing something beyond the random token
  // itself). Not strictly required by the current bearer-token-hash scheme,
  // but reserved so rotating to a signed/stateless scheme later doesn't
  // require a new env var. Falls back to a dev-only constant so local dev
  // without a `.env` doesn't hard-fail; production must set a real value.
  SESSION_SECRET: z
    .string()
    .min(32, "SESSION_SECRET must be at least 32 characters")
    .default("dev-only-insecure-session-secret-not-for-production-use"),
  NODE_ENV: z
    .enum(["development", "production", "test"])
    .default("development"),
  // Used to build absolute password-reset links (see
  // src/lib/actions/password-reset.ts). `z.string().min(1)` rejects an
  // empty string, not just a missing key, so a misconfigured build-time env
  // (unset var substituted as "") fails fast here instead of silently
  // producing a link with no origin.
  NEXT_PUBLIC_APP_URL: z
    .string()
    .min(1)
    .default("http://localhost:3000"),
});

export type Env = z.infer<typeof envSchema>;

let cached: Env | null = null;

/**
 * Validate and return process.env. Throws a descriptive error if a required
 * variable is missing/malformed — call this from request-time code paths
 * (auth helpers, route handlers, server actions), never from module scope,
 * so `next build`'s static analysis/collection phase never triggers it.
 */
export function getEnv(): Env {
  if (cached) return cached;

  const parsed = envSchema.safeParse(process.env);
  if (!parsed.success) {
    const issues = parsed.error.issues
      .map((issue) => `  - ${issue.path.join(".")}: ${issue.message}`)
      .join("\n");
    throw new Error(
      `Invalid or missing environment variables:\n${issues}\n\nCopy .env.example to .env and fill in real values.`,
    );
  }

  cached = parsed.data;
  return cached;
}

/** True in production; reads NODE_ENV directly (safe at module scope, no validation needed). */
export function isProduction(): boolean {
  return process.env.NODE_ENV === "production";
}
