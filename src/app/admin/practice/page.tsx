import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { requirePageRole } from "@/lib/auth/require-portal";
import { getPracticeDetails } from "@/lib/data/organization";
import { PracticeSettingsForm } from "@/components/admin/PracticeSettingsForm";

export const metadata: Metadata = {
  title: "Practice",
  description: "Practice name, contact details and clinic timezone.",
};

export default async function AdminPracticePage() {
  const session = await requirePageRole(["ADMIN"]);
  const practice = await getPracticeDetails(session.user.organizationId);
  if (!practice) notFound();

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold text-text-primary">Practice</h1>
        <p className="text-sm text-text-secondary">
          Settings that apply to everyone at {practice.name}.
        </p>
      </div>

      <PracticeSettingsForm
        name={practice.name}
        timezone={practice.timezone}
        phone={practice.phone ?? ""}
        email={practice.email ?? ""}
        addressLine={practice.addressLine ?? ""}
      />
    </div>
  );
}
