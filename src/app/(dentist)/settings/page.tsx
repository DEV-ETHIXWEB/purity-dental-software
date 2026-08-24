import type { Metadata } from "next";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Avatar } from "@/components/ui/Avatar";
import { currentProvider } from "@/lib/sample-data";

export const metadata: Metadata = {
  title: "Settings",
  description: "Manage your provider profile and notification preferences.",
};

export default function SettingsPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold text-text-primary">Settings</h1>
        <p className="text-sm text-text-secondary">Manage your profile and preferences.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Profile</CardTitle>
          <CardDescription>This information is visible to your care team.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-5">
          <div className="flex items-center gap-4">
            <Avatar name={currentProvider.name} size="lg" />
            <Button variant="outline" size="sm">
              Change photo
            </Button>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Input label="Full name" defaultValue={currentProvider.name} />
            <Input label="Role" defaultValue="Dentist" disabled />
            <Input label="Email" type="email" defaultValue="emily.avery@purityclinic.example" />
            <Input label="Phone" type="tel" defaultValue="(555) 010-2233" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Notifications</CardTitle>
          <CardDescription>Choose what you get notified about.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          {[
            { id: "notif-appts", label: "New and updated appointments" },
            { id: "notif-followups", label: "Follow-up reminders" },
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
                className="h-4 w-4 rounded border-border-strong text-[var(--color-brand-blue)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-brand-blue)]"
              />
            </label>
          ))}
        </CardContent>
      </Card>

      <div>
        <Button>Save changes</Button>
      </div>
    </div>
  );
}
