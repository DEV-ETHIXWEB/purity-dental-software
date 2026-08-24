import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

/**
 * `rate-limit.ts` keeps its bucket state in a module-level `Map`, so each
 * test re-imports the module fresh (`vi.resetModules()` + dynamic `import()`)
 * to avoid one test's attempts bleeding into another's via shared state.
 */
async function freshRateLimit() {
  const mod = await import("./rate-limit");
  return mod;
}

describe("checkRateLimit", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("allows up to MAX_ATTEMPTS (10) requests within the window", async () => {
    const { checkRateLimit } = await freshRateLimit();
    const key = "test:allow-under-limit";
    for (let i = 0; i < 10; i++) {
      const result = checkRateLimit(key);
      expect(result.allowed).toBe(true);
    }
  });

  it("blocks the 11th request within the same window", async () => {
    const { checkRateLimit } = await freshRateLimit();
    const key = "test:block-over-limit";
    for (let i = 0; i < 10; i++) {
      checkRateLimit(key);
    }
    const eleventh = checkRateLimit(key);
    expect(eleventh.allowed).toBe(false);
    expect(eleventh.retryAfterMs).toBeGreaterThan(0);
  });

  it("resets after the 15-minute window passes", async () => {
    const { checkRateLimit } = await freshRateLimit();
    const key = "test:reset-after-window";
    for (let i = 0; i < 10; i++) {
      checkRateLimit(key);
    }
    expect(checkRateLimit(key).allowed).toBe(false);

    // Advance past the 15-minute sliding window.
    vi.advanceTimersByTime(15 * 60 * 1000 + 1);

    const afterReset = checkRateLimit(key);
    expect(afterReset.allowed).toBe(true);
  });

  it("tracks separate keys independently", async () => {
    const { checkRateLimit } = await freshRateLimit();
    for (let i = 0; i < 10; i++) {
      checkRateLimit("test:key-a");
    }
    expect(checkRateLimit("test:key-a").allowed).toBe(false);
    // A different key should be unaffected.
    expect(checkRateLimit("test:key-b").allowed).toBe(true);
  });
});

describe("loginRateLimitKey", () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it("builds a key combining ip and email", async () => {
    const { loginRateLimitKey } = await freshRateLimit();
    expect(loginRateLimitKey("1.2.3.4", "user@example.com")).toBe(
      "login:1.2.3.4:user@example.com",
    );
  });

  it("lowercases email casing consistently — same email different casing produces the same rate-limit key (regression test for the email-casing bug fixed this session)", async () => {
    const { loginRateLimitKey } = await freshRateLimit();
    const keyLower = loginRateLimitKey("1.2.3.4", "foo@bar.com");
    const keyMixed = loginRateLimitKey("1.2.3.4", "Foo@Bar.COM");
    expect(keyMixed).toBe(keyLower);
  });

  it("trims whitespace from the email before building the key", async () => {
    const { loginRateLimitKey } = await freshRateLimit();
    expect(loginRateLimitKey("1.2.3.4", "  user@example.com  ")).toBe(
      "login:1.2.3.4:user@example.com",
    );
  });

  it("would have caught the casing bug: hammering with mixed-case emails hits one shared bucket", async () => {
    const { checkRateLimit, loginRateLimitKey } = await freshRateLimit();
    const variants = ["foo@bar.com", "Foo@Bar.com", "FOO@BAR.COM", "fOo@bAr.CoM"];
    // 10 attempts total, spread across differently-cased variants of the
    // same email, should still hit the shared 10-attempt limit — if the key
    // were case-sensitive, each variant would get its own fresh bucket and
    // an attacker could bypass the limit by varying email casing per attempt.
    for (let i = 0; i < 10; i++) {
      const key = loginRateLimitKey("9.9.9.9", variants[i % variants.length]);
      const result = checkRateLimit(key);
      expect(result.allowed).toBe(true);
    }
    const eleventh = checkRateLimit(loginRateLimitKey("9.9.9.9", "FOO@bar.COM"));
    expect(eleventh.allowed).toBe(false);
  });
});
