import { test, expect } from "@playwright/test";

/**
 * `/reset-password` page. Like ForgotPasswordForm, ResetPasswordForm has no
 * client-side pre-submit guard for password strength/match — it calls the
 * `resetPassword` Server Action, which Zod-validates (`resetPasswordSchema`)
 * BEFORE any Prisma call. Password-strength/mismatch errors are therefore
 * still genuinely testable without a DB. What is NOT testable here: a valid
 * token actually being accepted (requires a real `PasswordResetToken` row),
 * so this suite doesn't attempt that.
 */
test.describe("/reset-password page", () => {
  test("renders the reset form", async ({ page }) => {
    await page.goto("/reset-password?token=some-token");
    await expect(page.getByRole("heading", { name: "Set a new password" })).toBeVisible();
    await expect(page.getByLabel("New password", { exact: true })).toBeVisible();
    await expect(page.getByLabel("Confirm new password")).toBeVisible();
    await expect(page.getByRole("button", { name: "Reset password" })).toBeVisible();
  });

  test("shows an error when the token query param is entirely missing (caught before the server call)", async ({ page }) => {
    await page.goto("/reset-password");
    await page.getByLabel("New password", { exact: true }).fill("StrongPass1");
    await page.getByLabel("Confirm new password").fill("StrongPass1");
    await page.getByRole("button", { name: "Reset password" }).click();
    await expect(
      page.getByText("This reset link is missing its token. Please request a new one."),
    ).toBeVisible();
  });

  test("shows a mismatch error when password and confirmation differ (server-validated, no DB needed)", async ({ page }) => {
    await page.goto("/reset-password?token=some-token");
    await page.getByLabel("New password", { exact: true }).fill("StrongPass1");
    await page.getByLabel("Confirm new password").fill("Different2Pass");
    await page.getByRole("button", { name: "Reset password" }).click();
    // The message is rendered twice by design: once as the field-level error
    // under "Confirm new password", and once as the form-level banner — so
    // assert on the count rather than a single ambiguous match.
    const matches = page.getByText("Passwords don't match.");
    await expect(matches).toHaveCount(2);
    await expect(matches.first()).toBeVisible();
  });

  test("shows a weak-password error when missing an uppercase/lowercase/digit", async ({ page }) => {
    await page.goto("/reset-password?token=some-token");
    await page.getByLabel("New password", { exact: true }).fill("alllowercase");
    await page.getByLabel("Confirm new password").fill("alllowercase");
    await page.getByRole("button", { name: "Reset password" }).click();
    // Rendered twice (field-level + form-level banner) — see the mismatch
    // test above for why .first() is used instead of a bare toBeVisible().
    const matches = page.getByText(
      "Password must include an uppercase letter, a lowercase letter, and a number.",
    );
    await expect(matches).toHaveCount(2);
    await expect(matches.first()).toBeVisible();
  });

  test("shows a too-short-password error under the 10 character minimum", async ({ page }) => {
    await page.goto("/reset-password?token=some-token");
    await page.getByLabel("New password", { exact: true }).fill("Sh0rt1");
    await page.getByLabel("Confirm new password").fill("Sh0rt1");
    await page.getByRole("button", { name: "Reset password" }).click();
    // Rendered twice (field-level + form-level banner) — see the mismatch
    // test above for why .first() is used instead of a bare toBeVisible().
    const matches = page.getByText("Password must be at least 10 characters.");
    await expect(matches).toHaveCount(2);
    await expect(matches.first()).toBeVisible();
  });

  test("has a working link back to /login", async ({ page }) => {
    await page.goto("/reset-password?token=some-token");
    await page.getByRole("link", { name: "Back to sign in" }).click();
    await expect(page).toHaveURL(/\/login$/);
  });
});
