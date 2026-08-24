import { test, expect } from "@playwright/test";

/**
 * Security headers applied by `src/middleware.ts` to every matched response
 * (see its `applySecurityHeaders` + `buildCsp`). Checked on both a page
 * navigation and a route handler response, since the middleware matcher
 * covers everything except `_next/static`, `_next/image`, and `favicon.ico`.
 */
test.describe("security headers", () => {
  test("/login response carries CSP, nosniff, referrer-policy, permissions-policy, and frame-ancestors", async ({ page }) => {
    const response = await page.goto("/login");
    expect(response).not.toBeNull();
    const headers = response!.headers();

    expect(headers["content-security-policy"]).toBeTruthy();
    expect(headers["content-security-policy"]).toContain("frame-ancestors 'none'");
    expect(headers["content-security-policy"]).toContain("default-src 'self'");
    expect(headers["content-security-policy"]).toMatch(/script-src[^;]*'nonce-[^']+'/);

    expect(headers["x-content-type-options"]).toBe("nosniff");
    expect(headers["referrer-policy"]).toBe("strict-origin-when-cross-origin");
    expect(headers["permissions-policy"]).toBe("geolocation=(), camera=(), microphone=()");
    expect(headers["x-frame-options"]).toBe("DENY");
  });

  test("/api/health response also carries the same security headers", async ({ request }) => {
    const response = await request.get("/api/health");
    const headers = response.headers();

    expect(headers["content-security-policy"]).toBeTruthy();
    expect(headers["x-content-type-options"]).toBe("nosniff");
    expect(headers["referrer-policy"]).toBe("strict-origin-when-cross-origin");
    expect(headers["permissions-policy"]).toBe("geolocation=(), camera=(), microphone=()");
    expect(headers["x-frame-options"]).toBe("DENY");
  });

  test("CSP does not include unsafe-inline or unsafe-eval in production build", async ({ page }) => {
    const response = await page.goto("/login");
    const csp = response!.headers()["content-security-policy"];
    // Playwright's webServer runs `npm run build && npm run start`, i.e. a
    // real production build — buildCsp() only adds 'unsafe-eval'/
    // 'unsafe-inline' when NODE_ENV === "development".
    expect(csp).not.toContain("unsafe-eval");
    expect(csp).not.toContain("unsafe-inline");
  });

  test("each navigation gets a fresh CSP nonce (not a fixed/reused value)", async ({ page }) => {
    const first = await page.goto("/login");
    const firstNonce = first!.headers()["content-security-policy"]?.match(/'nonce-([^']+)'/)?.[1];

    const second = await page.goto("/login");
    const secondNonce = second!.headers()["content-security-policy"]?.match(/'nonce-([^']+)'/)?.[1];

    expect(firstNonce).toBeTruthy();
    expect(secondNonce).toBeTruthy();
    expect(firstNonce).not.toBe(secondNonce);
  });
});
