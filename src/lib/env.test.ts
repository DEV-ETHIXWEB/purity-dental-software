import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

/**
 * `env.ts` caches its parsed result in a module-level `cached` variable and
 * reads `process.env` only inside `getEnv()`. Each test snapshots/restores
 * `process.env` and re-imports the module fresh so one test's env mutation
 * (or cached result) can't leak into another.
 */
const ORIGINAL_ENV = { ...process.env };

async function freshEnv() {
  vi.resetModules();
  return import("./env");
}

/**
 * `NODE_ENV` is typed as a readonly property on `process.env` (`@types/node`
 * models it specially since Next/webpack/etc. often statically replace it).
 * Tests still need to set/delete it to exercise `getEnv()`'s NODE_ENV
 * handling, so route the write through an untyped index instead of
 * scattering `as any` at each call site.
 */
function setEnvVar(key: string, value: string | undefined) {
  const env = process.env as unknown as Record<string, string | undefined>;
  if (value === undefined) {
    delete env[key];
  } else {
    env[key] = value;
  }
}

describe("getEnv", () => {
  beforeEach(() => {
    process.env = { ...ORIGINAL_ENV };
  });

  afterEach(() => {
    process.env = { ...ORIGINAL_ENV };
  });

  it("throws a descriptive error when DATABASE_URL is missing", async () => {
    delete process.env.DATABASE_URL;
    const { getEnv } = await freshEnv();
    expect(() => getEnv()).toThrow(/DATABASE_URL/);
  });

  it("succeeds when required vars are present", async () => {
    process.env.DATABASE_URL = "postgresql://user:pass@localhost:5432/db";
    const { getEnv } = await freshEnv();
    expect(() => getEnv()).not.toThrow();
    const env = getEnv();
    expect(env.DATABASE_URL).toBe("postgresql://user:pass@localhost:5432/db");
  });

  it("SESSION_SECRET falls back to the documented dev default when unset", async () => {
    process.env.DATABASE_URL = "postgresql://user:pass@localhost:5432/db";
    delete process.env.SESSION_SECRET;
    const { getEnv } = await freshEnv();
    const env = getEnv();
    expect(env.SESSION_SECRET).toBe("dev-only-insecure-session-secret-not-for-production-use");
  });

  it("uses an explicit SESSION_SECRET when provided (and long enough)", async () => {
    process.env.DATABASE_URL = "postgresql://user:pass@localhost:5432/db";
    process.env.SESSION_SECRET = "a".repeat(32);
    const { getEnv } = await freshEnv();
    expect(getEnv().SESSION_SECRET).toBe("a".repeat(32));
  });

  it("rejects a SESSION_SECRET shorter than 32 characters", async () => {
    process.env.DATABASE_URL = "postgresql://user:pass@localhost:5432/db";
    process.env.SESSION_SECRET = "too-short";
    const { getEnv } = await freshEnv();
    expect(() => getEnv()).toThrow(/SESSION_SECRET/);
  });

  it("NEXT_PUBLIC_APP_URL falls back to localhost when unset", async () => {
    process.env.DATABASE_URL = "postgresql://user:pass@localhost:5432/db";
    delete process.env.NEXT_PUBLIC_APP_URL;
    const { getEnv } = await freshEnv();
    expect(getEnv().NEXT_PUBLIC_APP_URL).toBe("http://localhost:3000");
  });

  it(
    "rejects an explicitly empty NEXT_PUBLIC_APP_URL rather than silently falling back " +
      "(regression test: the old buggy `?? \"http://localhost:3000\"` pattern would have " +
      "treated an empty string as present and let it through unchanged, since `??` only " +
      "falls back on null/undefined, not on empty string)",
    async () => {
      process.env.DATABASE_URL = "postgresql://user:pass@localhost:5432/db";
      process.env.NEXT_PUBLIC_APP_URL = "";
      const { getEnv } = await freshEnv();
      expect(() => getEnv()).toThrow(/NEXT_PUBLIC_APP_URL/);
    },
  );

  it("accepts an explicit non-empty NEXT_PUBLIC_APP_URL", async () => {
    process.env.DATABASE_URL = "postgresql://user:pass@localhost:5432/db";
    process.env.NEXT_PUBLIC_APP_URL = "https://app.purity.example.com";
    const { getEnv } = await freshEnv();
    expect(getEnv().NEXT_PUBLIC_APP_URL).toBe("https://app.purity.example.com");
  });

  it("caches the parsed result across multiple calls (module-level memoization)", async () => {
    process.env.DATABASE_URL = "postgresql://user:pass@localhost:5432/db";
    const { getEnv } = await freshEnv();
    const first = getEnv();
    process.env.DATABASE_URL = "postgresql://different/db";
    const second = getEnv();
    // Second call returns the cached (first) result, not a re-parse.
    expect(second).toBe(first);
    expect(second.DATABASE_URL).toBe("postgresql://user:pass@localhost:5432/db");
  });

  it("defaults NODE_ENV to development when unset", async () => {
    process.env.DATABASE_URL = "postgresql://user:pass@localhost:5432/db";
    setEnvVar("NODE_ENV", undefined);
    const { getEnv } = await freshEnv();
    expect(getEnv().NODE_ENV).toBe("development");
  });
});

describe("isProduction", () => {
  beforeEach(() => {
    process.env = { ...ORIGINAL_ENV };
  });

  afterEach(() => {
    process.env = { ...ORIGINAL_ENV };
  });

  it("returns true when NODE_ENV is production", async () => {
    setEnvVar("NODE_ENV", "production");
    const { isProduction } = await freshEnv();
    expect(isProduction()).toBe(true);
  });

  it("returns false when NODE_ENV is not production", async () => {
    setEnvVar("NODE_ENV", "development");
    const { isProduction } = await freshEnv();
    expect(isProduction()).toBe(false);
  });
});
