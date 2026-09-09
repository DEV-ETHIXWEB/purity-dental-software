import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ProfileSettingsCard } from "@/components/shell/ProfileSettingsCard";
import { NotificationPreferencesCard } from "@/components/shell/NotificationPreferencesCard";
import { requirePageRole } from "@/lib/auth/require-portal";
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
  const session = await requirePageRole(["PATIENT"]);
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
      <div className="animate-rise-in stagger-0">
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

      <NotificationPreferencesCard
        items={notificationOptions}
        description="Choose what you'd like us to notify you about."
        size="comfortable"
      />
    </div>
  );
}
