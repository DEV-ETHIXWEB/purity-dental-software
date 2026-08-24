import type { Metadata } from "next";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Avatar } from "@/components/ui/Avatar";
import { currentPatient, patientFullName } from "@/lib/sample-data";

export const metadata: Metadata = {
  title: "Settings",
  description: "Manage your profile, contact info, and notification preferences.",
};

const notificationOptions = [
  { id: "notif-appts", label: "Appointment reminders" },
  { id: "notif-messages", label: "New messages from your care team" },
  { id: "notif-billing", label: "Billing and payment updates" },
];

export default function PatientSettingsPage() {
  const name = patientFullName(currentPatient);
  const dob = new Date(currentPatient.dateOfBirth).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold text-text-primary">Settings</h1>
        <p className="text-sm text-text-secondary">Manage your profile and how we reach you.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Your profile</CardTitle>
          <CardDescription>This is what your care team sees for you.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-5">
          <div className="flex items-center gap-4">
            <Avatar name={name} src={currentPatient.photoUrl} size="lg" />
            <Button variant="outline" size="sm" className="min-h-11">
              Change photo
            </Button>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Input label="Full name" defaultValue={name} />
            <Input label="Date of birth" defaultValue={dob} disabled />
            <Input label="Email" type="email" defaultValue={currentPatient.email} />
            <Input label="Phone" type="tel" defaultValue={currentPatient.phone} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Notifications</CardTitle>
          <CardDescription>Choose what you&apos;d like us to notify you about.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          {notificationOptions.map((item) => (
            <label
              key={item.id}
              htmlFor={item.id}
              className="flex min-h-11 cursor-pointer items-center justify-between gap-3 rounded-[var(--radius-md)] border border-border p-3 text-sm hover:bg-surface-muted"
            >
              <span className="text-text-primary">{item.label}</span>
              <input
                id={item.id}
                type="checkbox"
                defaultChecked
                className="h-5 w-5 rounded border-border-strong text-[var(--color-brand-blue)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-brand-blue)]"
              />
            </label>
          ))}
        </CardContent>
      </Card>

      <div>
        <Button className="min-h-11">Save changes</Button>
      </div>
    </div>
  );
}
