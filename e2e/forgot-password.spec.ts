import { test, expect } from "@playwright/test";

/**
 * `/forgot-password` page. Unlike LoginForm, ForgotPasswordForm has no
 * client-side pre-submit guard (no `validateClientSide()`) — it always calls
 * the `requestPasswordReset` Server Action, which itself Zod-validates
 * (`requestPasswordResetSchema`) BEFORE touching Prisma. That validation
 * step runs the same with or without a live DB, so "empty email" /
 * "malformed email" are still genuinely testable here — the assertions below
 * wait for the server-rendered message rather than an instant client-side
 * error.
 */
test.describe("/forgot-password page", () => {
  test("renders the reset-request form", async ({ page }) => {
    await page.goto("/forgot-password");
    await expect(page.getByRole("heading", { name: "Reset your password" })).toBeVisible();
    await expect(page.getByLabel("Email")).toBeVisible();
    await expect(page.getByRole("button", { name: "Send reset link" })).toBeVisible();
  });

  test("shows a validation error for an empty submission (server-validated, no DB needed)", async ({ page }) => {
    await page.goto("/forgot-password");
    await page.getByRole("button", { name: "Send reset link" }).click();
    await expect(page.getByText("Email is required.")).toBeVisible();
  });

  test("shows a validation error for a malformed email", async ({ page }) => {
    await page.goto("/forgot-password");
    await page.getByLabel("Email").fill("not-an-email");
    await page.getByRole("button", { name: "Send reset link" }).click();
    await expect(page.getByText("Enter a valid email address.")).toBeVisible();
  });

  test("has a working link back to /login", async ({ page }) => {
    await page.goto("/forgot-password");
    await page.getByRole("link", { name: "Back to sign in" }).click();
    await expect(page).toHaveURL(/\/login$/);
  });
});
