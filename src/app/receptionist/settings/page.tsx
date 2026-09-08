import type { Metadata } from "next";
import { ProfileSettingsCard } from "@/components/shell/ProfileSettingsCard";
import { NotificationPreferencesCard } from "@/components/shell/NotificationPreferencesCard";
import { requireRole } from "@/lib/auth/authorize";

export const metadata: Metadata = {
  title: "Settings",
  description: "Manage your front-desk profile and notification preferences.",
};

export default async function ReceptionistSettingsPage() {
  const session = await requireRole(["RECEPTIONIST", "ADMIN"]);
  const { name, email, phone } = session.user;

  return (
    <div className="flex flex-col gap-6">
      <div className="animate-rise-in stagger-0">
        <h1 className="text-2xl font-semibold text-text-primary">Settings</h1>
        <p className="text-sm text-text-secondary">Manage your profile and preferences.</p>
      </div>

      <ProfileSettingsCard name={name} email={email} phone={phone ?? ""} roleLabel="Receptionist / Front Desk" />

      <NotificationPreferencesCard
        items={[
          { id: "notif-checkins", label: "Patient check-ins and no-shows" },
          { id: "notif-appts", label: "New and updated appointments" },
          { id: "notif-billing", label: "Billing and payment activity" },
        ]}
        description="Choose what you get notified about."
      />
    </div>
  );
}
