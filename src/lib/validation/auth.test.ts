import { describe, expect, it } from "vitest";
import { loginSchema, requestPasswordResetSchema, resetPasswordSchema } from "./auth";

describe("loginSchema", () => {
  it("accepts valid email + non-empty password", () => {
    const result = loginSchema.safeParse({ email: "user@example.com", password: "anything" });
    expect(result.success).toBe(true);
  });

  it("rejects a missing email", () => {
    const result = loginSchema.safeParse({ password: "anything" });
    expect(result.success).toBe(false);
  });

  it("rejects a malformed email", () => {
    const result = loginSchema.safeParse({ email: "not-an-email", password: "anything" });
    expect(result.success).toBe(false);
  });

  it("rejects an empty password", () => {
    const result = loginSchema.safeParse({ email: "user@example.com", password: "" });
    expect(result.success).toBe(false);
  });

  it("lowercases email casing on parse (regression test for the email-casing bug fixed this session)", () => {
    const result = loginSchema.safeParse({ email: "Foo@Bar.COM", password: "anything" });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.email).toBe("foo@bar.com");
    }
  });

  it("trims surrounding whitespace from email", () => {
    const result = loginSchema.safeParse({ email: "  user@example.com  ", password: "anything" });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.email).toBe("user@example.com");
    }
  });
});

describe("requestPasswordResetSchema", () => {
  it("accepts a valid email and lowercases it", () => {
    const result = requestPasswordResetSchema.safeParse({ email: "Someone@Example.COM" });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.email).toBe("someone@example.com");
    }
  });

  it("rejects a malformed email", () => {
    const result = requestPasswordResetSchema.safeParse({ email: "nope" });
    expect(result.success).toBe(false);
  });
});

describe("resetPasswordSchema", () => {
  const validToken = "some-reset-token";

  it("accepts a valid strong password with matching confirmation", () => {
    const result = resetPasswordSchema.safeParse({
      token: validToken,
      password: "Str0ngPassword",
      confirmPassword: "Str0ngPassword",
    });
    expect(result.success).toBe(true);
  });

  it("rejects mismatched password/confirmPassword", () => {
    const result = resetPasswordSchema.safeParse({
      token: validToken,
      password: "Str0ngPassword",
      confirmPassword: "Different1Password",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      const confirmError = result.error.issues.find((i) => i.path.includes("confirmPassword"));
      expect(confirmError).toBeDefined();
      expect(confirmError?.message).toBe("Passwords don't match.");
    }
  });

  it("rejects a password missing an uppercase letter", () => {
    const result = resetPasswordSchema.safeParse({
      token: validToken,
      password: "lowercase123",
      confirmPassword: "lowercase123",
    });
    expect(result.success).toBe(false);
  });

  it("rejects a password missing a lowercase letter", () => {
    const result = resetPasswordSchema.safeParse({
      token: validToken,
      password: "UPPERCASE123",
      confirmPassword: "UPPERCASE123",
    });
    expect(result.success).toBe(false);
  });

  it("rejects a password missing a digit", () => {
    const result = resetPasswordSchema.safeParse({
      token: validToken,
      password: "NoDigitsHere",
      confirmPassword: "NoDigitsHere",
    });
    expect(result.success).toBe(false);
  });

  it("rejects a password under the length minimum (10 chars)", () => {
    const result = resetPasswordSchema.safeParse({
      token: validToken,
      password: "Sh0rt1",
      confirmPassword: "Sh0rt1",
    });
    expect(result.success).toBe(false);
  });

  it("rejects a missing reset token", () => {
    const result = resetPasswordSchema.safeParse({
      token: "",
      password: "Str0ngPassword",
      confirmPassword: "Str0ngPassword",
    });
    expect(result.success).toBe(false);
  });
});
