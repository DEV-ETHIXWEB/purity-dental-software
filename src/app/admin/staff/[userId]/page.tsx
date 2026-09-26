import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { requirePageRole } from "@/lib/auth/require-portal";
import { getStaffMember } from "@/lib/data/staff";
import { StaffDetailsPanel } from "@/components/admin/StaffDetailsPanel";
import { PermissionsPanel } from "@/components/admin/PermissionsPanel";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ userId: string }>;
}): Promise<Metadata> {
  const session = await requirePageRole(["ADMIN"]);
  const { userId } = await params;
  const member = await getStaffMember(session.user.organizationId, userId);
  return { title: member ? member.name : "Staff member" };
}

export default async function StaffMemberPage({
  params,
}: {
  params: Promise<{ userId: string }>;
}) {
  const session = await requirePageRole(["ADMIN"]);
  const { userId } = await params;

  // Org-scoped read: an admin at another practice passing a valid id must
  // get the same "not found" as a made-up one.
  const member = await getStaffMember(session.user.organizationId, userId);
  if (!member) notFound();

  const isSelf = member.id === session.user.id;

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
        <h1 className="mt-2 text-2xl font-semibold text-text-primary">{member.name}</h1>
        <p className="text-sm text-text-secondary">{member.email}</p>
      </div>

      {/*
       * Stacked, not side by side.
       *
       * These were two columns, but the permissions card carries 13 rows and
       * ran 688px past the bottom of the details column — a ragged edge no
       * amount of stretching fixes, since the two are independent stacks
       * rather than paired cards. Full width also gives each permission row
       * room to put its description and its control on one line, and lets
       * the groups flow into two columns inside the card.
       */}
      <StaffDetailsPanel member={member} isSelf={isSelf} />
      <PermissionsPanel
        userId={member.id}
        role={member.role}
        permissionOverrides={member.permissionOverrides}
        isSelf={isSelf}
      />
    </div>
  );
}
