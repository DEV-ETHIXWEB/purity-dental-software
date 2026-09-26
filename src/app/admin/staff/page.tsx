import type { Metadata } from "next";
import Link from "next/link";
import { UserPlus } from "lucide-react";
import { requirePageRole } from "@/lib/auth/require-portal";
import { listStaff } from "@/lib/data/staff";
import { StaffTable } from "@/components/admin/StaffTable";

export const metadata: Metadata = {
  title: "Staff",
  description: "Add, edit and deactivate the people who work at this practice.",
};

export default async function AdminStaffPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const session = await requirePageRole(["ADMIN"]);
  const [staff, { q }] = await Promise.all([
    listStaff(session.user.organizationId),
    searchParams,
  ]);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-text-primary">Staff</h1>
          <p className="text-sm text-text-secondary">
            Everyone who works at this practice, and what each of them can do.
          </p>
        </div>
        <Link
          href="/admin/staff/new"
          className="cta-gradient-slide inline-flex h-10 items-center gap-2 self-start rounded-[var(--radius-lg)] px-4 text-sm font-medium text-white shadow-card focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-brand-blue)]"
        >
          <UserPlus className="h-4 w-4" aria-hidden="true" />
          Add staff member
        </Link>
      </div>

      <StaffTable staff={staff} initialQuery={q ?? ""} />
    </div>
  );
}
