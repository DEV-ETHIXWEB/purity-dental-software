import type { Metadata } from "next";
import { ProvidersManager } from "@/components/receptionist/ProvidersManager";
import { requirePageRole } from "@/lib/auth/require-portal";
import { listAllProviders } from "@/lib/data/providers";

export const metadata: Metadata = {
  title: "Team",
  description: "Add clinicians, correct their details, and switch accounts on or off.",
};

export default async function ReceptionistProvidersPage() {
  const session = await requirePageRole(["RECEPTIONIST", "ADMIN"]);
  const providers = await listAllProviders(session.user.organizationId);

  return (
    <div className="flex flex-col gap-6">
      <div className="animate-rise-in stagger-0">
        <h1 className="text-2xl font-semibold tracking-tight text-text-primary">Team</h1>
        <p className="text-sm text-text-secondary">
          Dentists and hygienists at this practice. Disabled accounts stay listed here so
          they can be switched back on.
        </p>
      </div>

      <ProvidersManager providers={providers} />
    </div>
  );
}
