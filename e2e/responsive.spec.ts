import { test, expect } from "@playwright/test";

/**
 * Basic responsive smoke test: /login must not horizontally overflow at a
 * narrow mobile viewport or a wide desktop viewport.
 */
test.describe("/login responsive layout", () => {
  test("no horizontal overflow at mobile viewport (375px)", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto("/login");
    const { scrollWidth, clientWidth } = await page.evaluate(() => ({
      scrollWidth: document.documentElement.scrollWidth,
      clientWidth: document.documentElement.clientWidth,
    }));
    expect(scrollWidth).toBeLessThanOrEqual(clientWidth);
  });

  test("no horizontal overflow at desktop viewport (1440px)", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/login");
    const { scrollWidth, clientWidth } = await page.evaluate(() => ({
      scrollWidth: document.documentElement.scrollWidth,
      clientWidth: document.documentElement.clientWidth,
    }));
    expect(scrollWidth).toBeLessThanOrEqual(clientWidth);
  });

  test("sign-in form and button remain visible/usable at mobile viewport", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto("/login");
    await expect(page.getByLabel("Email")).toBeVisible();
    await expect(page.getByLabel("Password", { exact: true })).toBeVisible();
    await expect(page.getByRole("button", { name: "Sign in" })).toBeVisible();
  });
});
