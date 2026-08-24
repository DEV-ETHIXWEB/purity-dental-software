import { z } from "zod";

/** Login form — server-side boundary (client-side "required" attributes are UX only, never trusted). */
export const loginSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, "Email is required.")
    .email("Enter a valid email address."),
  password: z.string().min(1, "Password is required."),
});
export type LoginInput = z.infer<typeof loginSchema>;

/** Request a password reset link. */
export const requestPasswordResetSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, "Email is required.")
    .email("Enter a valid email address."),
});
export type RequestPasswordResetInput = z.infer<
  typeof requestPasswordResetSchema
>;

const passwordComplexity = z
  .string()
  .min(10, "Password must be at least 10 characters.")
  .max(200, "Password is too long.")
  .refine((val) => /[a-z]/.test(val) && /[A-Z]/.test(val) && /[0-9]/.test(val), {
    message:
      "Password must include an uppercase letter, a lowercase letter, and a number.",
  });

/** Complete a password reset with a token from the reset link + a new password. */
export const resetPasswordSchema = z
  .object({
    token: z.string().min(1, "Reset token is missing."),
    password: passwordComplexity,
    confirmPassword: z.string().min(1, "Please confirm your new password."),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match.",
    path: ["confirmPassword"],
  });
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
