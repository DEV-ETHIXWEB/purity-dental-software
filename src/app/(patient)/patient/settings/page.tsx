import type { Metadata } from "next";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/Card";
import { notFound } from "next/navigation";
import { ProfileSettingsCard } from "@/components/shell/ProfileSettingsCard";
import { requireRole } from "@/lib/auth/authorize";
import { getPatientForUser } from "@/lib/data/patients";
import { patientFullName } from "@/lib/patient-format";

export const metadata: Metadata = {
  title: "Settings",
  description: "Manage your profile, contact info, and notification preferences.",
};

const notificationOptions = [
  { id: "notif-appts", label: "Appointment reminders" },
  { id: "notif-messages", label: "New messages from your care team" },
  { id: "notif-billing", label: "Billing and payment updates" },
];

export default async function PatientSettingsPage() {
  const session = await requireRole(["PATIENT"]);
  const currentPatient = await getPatientForUser(session.user.id);
  if (!currentPatient) notFound();

  const name = patientFullName(currentPatient);
  const dob = currentPatient.dateOfBirth.toLocaleDateString("en-US", {
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

      <ProfileSettingsCard
        name={name}
        email={currentPatient.email ?? ""}
        phone={currentPatient.phone ?? ""}
        roleLabel="Patient"
        photoUrl={currentPatient.photoUrl}
        extraReadOnlyField={{ label: "Date of birth", value: dob }}
      />

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
                className="h-5 w-5 rounded border-border-strong accent-[var(--color-brand-blue)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-brand-blue)]"
              />
            </label>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
