import { test, expect } from "@playwright/test";

/**
 * `/login` page — rendering + client-side validation only. Successful sign-in
 * is NOT tested (requires a live database; see playwright.config.ts header
 * comment). The `login` Server Action itself is untestable here, but the
 * form's own client-side guard (src/components/auth/LoginForm.tsx
 * `validateClientSide()`) runs entirely in the browser and never reaches the
 * server for an empty submission, so it's fair game.
 */
test.describe("/login page", () => {
  test("renders the sign-in form with a heading and both fields", async ({ page }) => {
    await page.goto("/login");
    await expect(page.getByRole("heading", { name: "Welcome back" })).toBeVisible();
    await expect(page.getByLabel("Email")).toBeVisible();
    await expect(page.getByLabel("Password", { exact: true })).toBeVisible();
    await expect(page.getByRole("button", { name: "Sign in" })).toBeVisible();
  });

  test("shows field errors for an empty submission without leaving the page", async ({ page }) => {
    await page.goto("/login");
    await page.getByRole("button", { name: "Sign in" }).click();

    await expect(page.getByText("Email is required.")).toBeVisible();
    await expect(page.getByText("Password is required.")).toBeVisible();
    await expect(page).toHaveURL(/\/login$/);
  });

  test("clears the email field error once the user starts typing a value", async ({ page }) => {
    await page.goto("/login");
    await page.getByRole("button", { name: "Sign in" }).click();
    await expect(page.getByText("Email is required.")).toBeVisible();

    await page.getByLabel("Email").fill("a");
    await expect(page.getByText("Email is required.")).not.toBeVisible();
  });

  test("the email input has type=email (native format hinting) and marks aria-invalid after a failed submit", async ({ page }) => {
    await page.goto("/login");
    const emailInput = page.getByLabel("Email");
    await expect(emailInput).toHaveAttribute("type", "email");

    await page.getByRole("button", { name: "Sign in" }).click();
    await expect(emailInput).toHaveAttribute("aria-invalid", "true");
  });

  test("has a working link to /forgot-password", async ({ page }) => {
    await page.goto("/login");
    await page.getByRole("link", { name: "Forgot your password?" }).click();
    await expect(page).toHaveURL(/\/forgot-password$/);
  });

  test("form fields are keyboard-navigable in a sensible tab order", async ({ page }) => {
    await page.goto("/login");
    await page.getByLabel("Email").focus();
    await expect(page.getByLabel("Email")).toBeFocused();

    await page.keyboard.press("Tab");
    await expect(page.getByLabel("Password", { exact: true })).toBeFocused();

    // Next stop is the password field's own show/hide toggle, not the
    // submit button — it's part of the same control and must be reachable
    // right after it.
    await page.keyboard.press("Tab");
    await expect(page.getByRole("button", { name: "Show password" })).toBeFocused();

    // Then the two controls that sit between the password and the CTA in
    // the redesigned form: "Remember me" and the forgot-password link.
    await page.keyboard.press("Tab");
    await expect(page.getByRole("checkbox", { name: "Remember me" })).toBeFocused();

    await page.keyboard.press("Tab");
    await expect(page.getByRole("link", { name: "Forgot your password?" })).toBeFocused();

    await page.keyboard.press("Tab");
    await expect(page.getByRole("button", { name: "Sign in" })).toBeFocused();
  });

  test("labels are correctly associated with their inputs via htmlFor/id", async ({ page }) => {
    await page.goto("/login");
    const emailInput = page.getByLabel("Email");
    const passwordInput = page.getByLabel("Password", { exact: true });
    // getByLabel only resolves if label[for] -> input[id] association is
    // correct, so successfully locating both is itself the assertion; this
    // also double-checks each resolves to exactly one <input>.
    await expect(emailInput).toHaveCount(1);
    await expect(passwordInput).toHaveCount(1);
    await expect(passwordInput).toHaveAttribute("type", "password");
  });

  test("the Remember me box starts checked and toggles", async ({ page }) => {
    await page.goto("/login");
    const remember = page.getByRole("checkbox", { name: "Remember me" });
    await expect(remember).toHaveAttribute("aria-checked", "true");
    await remember.click();
    await expect(remember).toHaveAttribute("aria-checked", "false");
  });

  test("the brand showcase rotates between its three slides", async ({ page }) => {
    await page.goto("/login");
    const dots = page.getByRole("button", { name: /^Show slide / });
    await expect(dots).toHaveCount(3);

    // Jump straight to the third slide rather than waiting out the timer.
    await dots.nth(2).click();
    await expect(dots.nth(2)).toHaveAttribute("aria-current", "true");
    await expect(dots.nth(0)).not.toHaveAttribute("aria-current", "true");
  });
});
