import type { Metadata } from "next";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/Card";
import { ProfileSettingsCard } from "@/components/shell/ProfileSettingsCard";
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
      <div>
        <h1 className="text-2xl font-semibold text-text-primary">Settings</h1>
        <p className="text-sm text-text-secondary">Manage your profile and preferences.</p>
      </div>

      <ProfileSettingsCard name={name} email={email} phone={phone ?? ""} roleLabel="Receptionist / Front Desk" />

      <Card>
        <CardHeader>
          <CardTitle>Notifications</CardTitle>
          <CardDescription>Choose what you get notified about.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          {[
            { id: "notif-checkins", label: "Patient check-ins and no-shows" },
            { id: "notif-appts", label: "New and updated appointments" },
            { id: "notif-billing", label: "Billing and payment activity" },
          ].map((item) => (
            <label
              key={item.id}
              htmlFor={item.id}
              className="flex cursor-pointer items-center justify-between gap-3 rounded-[var(--radius-md)] border border-border p-3 text-sm hover:bg-surface-muted"
            >
              <span className="text-text-primary">{item.label}</span>
              <input
                id={item.id}
                type="checkbox"
                defaultChecked
                className="h-4 w-4 rounded border-border-strong accent-[var(--color-brand-blue)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-brand-blue)]"
              />
            </label>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
