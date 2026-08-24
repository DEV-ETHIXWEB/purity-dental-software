import type { Metadata } from "next";
import { ResetPasswordForm } from "@/components/auth/ResetPasswordForm";

export const metadata: Metadata = {
  title: "Reset Password",
  description: "Set a new password for your Purity account.",
};

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;

  return (
    <div className="flex min-h-full w-full flex-1 items-center justify-center bg-surface-muted px-4 py-12">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-semibold text-text-primary">Purity</h1>
          <p className="text-sm text-text-secondary">Dental clinic practice management</p>
        </div>
        <ResetPasswordForm token={token ?? ""} />
      </div>
    </div>
  );
}
