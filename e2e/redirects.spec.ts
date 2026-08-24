import { test, expect } from "@playwright/test";

/**
 * Unauthenticated redirect behavior — exercises `src/middleware.ts`'s
 * cookie-presence gate. No DB involved: middleware only checks whether the
 * session cookie exists, never its validity, so this works fully offline.
 */
test.describe("unauthenticated portal redirects", () => {
  const protectedPaths = [
    "/dashboard",
    "/hygienist/dashboard",
    "/receptionist/dashboard",
    "/patient/dashboard",
  ];

  for (const path of protectedPaths) {
    test(`visiting ${path} without a session redirects to /login`, async ({ page }) => {
      await page.goto(path);
      await expect(page).toHaveURL(/\/login(\?.*)?$/);
    });

    test(`redirect from ${path} preserves the original path in the "from" query param`, async ({ page }) => {
      await page.goto(path);
      const url = new URL(page.url());
      expect(url.searchParams.get("from")).toBe(path);
    });
  }

  test("other Dentist-portal prefixes also redirect (schedule, patients, billing, settings)", async ({ page }) => {
    for (const path of ["/schedule", "/patients", "/billing", "/settings"]) {
      await page.goto(path);
      await expect(page).toHaveURL(/\/login(\?.*)?$/);
    }
  });
});
