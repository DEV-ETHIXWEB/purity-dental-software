import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

/**
 * Automated WCAG 2.0/2.1 A+AA scans (axe-core) for every page reachable
 * without a live database — see playwright.config.ts's header comment for
 * why authenticated portal pages aren't covered here. This formalizes what
 * would otherwise be a one-off manual check into a standing regression
 * test: a future change that breaks a label, a focus trap, or a contrast
 * token fails CI here instead of only being caught by chance.
 */
test.describe("accessibility (axe-core)", () => {
  for (const path of ["/login", "/forgot-password", "/reset-password"]) {
    test(`${path} has no WCAG A/AA violations`, async ({ page }) => {
      await page.goto(path);
      const results = await new AxeBuilder({ page })
        .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
        .analyze();
      expect(results.violations, JSON.stringify(results.violations, null, 2)).toEqual([]);
    });
  }

  test("404 page has no WCAG A/AA violations", async ({ page }) => {
    await page.goto("/this-route-does-not-exist");
    const results = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
      .analyze();
    expect(results.violations, JSON.stringify(results.violations, null, 2)).toEqual([]);
  });
});
