import type { Metadata } from "next";
import { ProfileSettingsCard } from "@/components/shell/ProfileSettingsCard";
import { NotificationPreferencesCard } from "@/components/shell/NotificationPreferencesCard";
import { requirePageRole } from "@/lib/auth/require-portal";

export const metadata: Metadata = {
  title: "Settings",
  description: "Manage your provider profile and notification preferences.",
};

export default async function SettingsPage() {
  const session = await requirePageRole(["DENTIST", "ADMIN"]);
  const { name, email, phone, avatarUrl } = session.user;

  return (
    <div className="flex flex-col gap-6">
      <div className="animate-rise-in stagger-0">
        <h1 className="text-2xl font-semibold text-text-primary">Settings</h1>
        <p className="text-sm text-text-secondary">Manage your profile and preferences.</p>
      </div>

      <ProfileSettingsCard name={name} email={email} phone={phone ?? ""} roleLabel="Dentist" photoUrl={avatarUrl} />

      <NotificationPreferencesCard
        items={[
          { id: "notif-appts", label: "New and updated appointments" },
          { id: "notif-followups", label: "Follow-up reminders" },
          { id: "notif-billing", label: "Billing and payment activity" },
        ]}
        description="Choose what you get notified about."
      />
    </div>
  );
}
