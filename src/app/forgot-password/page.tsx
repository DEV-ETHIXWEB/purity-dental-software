import type { Metadata } from "next";
import { ForgotPasswordForm } from "@/components/auth/ForgotPasswordForm";

export const metadata: Metadata = {
  title: "Forgot Password",
  description: "Request a password reset link for your Purity account.",
};

export default function ForgotPasswordPage() {
  return (
    <div className="flex min-h-full w-full flex-1 items-center justify-center bg-surface-muted px-4 py-12">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-semibold text-text-primary">Purity</h1>
          <p className="text-sm text-text-secondary">Dental clinic practice management</p>
        </div>
        <ForgotPasswordForm />
      </div>
    </div>
  );
}
