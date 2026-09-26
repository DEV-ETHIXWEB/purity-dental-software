import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { requirePageRole } from "@/lib/auth/require-portal";
import { NewStaffForm } from "@/components/admin/NewStaffForm";

export const metadata: Metadata = {
  title: "Add staff member",
  description: "Create an account for a dentist, hygienist, receptionist or admin.",
};

export default async function NewStaffPage() {
  await requirePageRole(["ADMIN"]);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link
          href="/admin/staff"
          className="touch-link gap-1.5 text-sm text-text-secondary hover:text-text-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-brand-blue)]"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          All staff
        </Link>
        <h1 className="mt-2 text-2xl font-semibold text-text-primary">Add staff member</h1>
        <p className="text-sm text-text-secondary">
          Creates a working account they can sign in with straight away.
        </p>
      </div>

      <NewStaffForm />
    </div>
  );
}
