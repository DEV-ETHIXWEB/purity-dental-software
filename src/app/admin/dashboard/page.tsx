import type { Metadata } from "next";
import Link from "next/link";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Avatar } from "@/components/ui/Avatar";
import { requirePageRole } from "@/lib/auth/require-portal";
import { staffCountsByRole, ROLE_LABELS, STAFF_ROLES } from "@/lib/data/staff";
import { listAuditEntries } from "@/lib/data/audit";
import { getPracticeDetails } from "@/lib/data/organization";
import { prisma } from "@/lib/prisma";
import { clinicStartOfDay, clinicStartOfNextDay, formatClinicDateTime } from "@/lib/datetime";
import { DEFAULT_CLINIC_TIMEZONE } from "@/lib/datetime";
import { describeAuditAction } from "@/lib/audit-format";

export const metadata: Metadata = {
  title: "Overview",
  description: "Practice headcount, patients and recent activity.",
};

export default async function AdminDashboardPage() {
  const session = await requirePageRole(["ADMIN"]);
  const organizationId = session.user.organizationId;

  const practice = await getPracticeDetails(organizationId);
  const timeZone = practice?.timezone ?? DEFAULT_CLINIC_TIMEZONE;
  const now = new Date();

  const [counts, activePatients, todaysAppointments, recent] = await Promise.all([
    staffCountsByRole(organizationId),
    prisma.patient.count({ where: { organizationId, status: "ACTIVE" } }),
    prisma.appointment.count({
      where: {
        organizationId,
        status: { not: "CANCELLED" },
        startTime: {
          gte: clinicStartOfDay(now, timeZone),
          lt: clinicStartOfNextDay(now, timeZone),
        },
      },
    }),
    listAuditEntries(organizationId, { take: 8 }),
  ]);

  const totalStaff = STAFF_ROLES.reduce((sum, role) => sum + counts[role], 0);

  const stats = [
    { label: "Staff", value: totalStaff, href: "/admin/staff" },
    { label: "Active patients", value: activePatients, href: null },
    { label: "Appointments today", value: todaysAppointments, href: null },
  ];

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold text-text-primary">
          {practice?.name ?? "Practice"} overview
        </h1>
        <p className="text-sm text-text-secondary">
          Who works here, how busy today is, and what changed recently.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
        {stats.map((stat) => {
          const body = (
            <Card className="h-full transition-shadow duration-300 ease-out hover:shadow-card-hover">
              <CardContent>
                <p className="text-sm font-medium text-text-secondary">{stat.label}</p>
                <p className="mt-1 text-3xl font-bold tracking-tight text-text-primary">
                  {stat.value}
                </p>
              </CardContent>
            </Card>
          );
          return stat.href ? (
            <Link
              key={stat.label}
              href={stat.href}
              className="rounded-[var(--radius-xl)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-brand-blue)]"
            >
              {body}
            </Link>
          ) : (
            <div key={stat.label}>{body}</div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 items-stretch gap-6 lg:grid-cols-3">
        <Card className="flex flex-col lg:col-span-1">
          <CardHeader>
            <CardTitle>Headcount</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-1 flex-col">
            <dl className="flex flex-1 flex-col divide-y divide-border">
              {STAFF_ROLES.map((role) => (
                <div key={role} className="flex items-center justify-between py-2.5">
                  <dt className="text-sm text-text-secondary">{ROLE_LABELS[role]}</dt>
                  <dd className="text-sm font-semibold text-text-primary">{counts[role]}</dd>
                </div>
              ))}
            </dl>
          </CardContent>
        </Card>

        <Card className="flex flex-col lg:col-span-2">
          <CardHeader>
            <CardTitle>Recent activity</CardTitle>
            <Link
              href="/admin/audit"
              className="touch-link text-sm text-[var(--color-brand-blue-text)] hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-brand-blue)]"
            >
              View all
            </Link>
          </CardHeader>
          <CardContent className="flex flex-1 flex-col">
            {recent.length === 0 ? (
              <div className="flex flex-1 flex-col items-center justify-center rounded-[var(--radius-lg)] border border-dashed border-border-strong py-10 text-center">
                <p className="text-sm font-medium text-text-primary">Nothing recorded yet</p>
                <p className="mt-1 max-w-xs text-xs text-text-secondary">
                  Changes staff make to appointments, patients and billing will show up here.
                </p>
              </div>
            ) : (
              <ul className="flex-1 divide-y divide-border">
                {recent.map((entry) => (
                  <li key={entry.id} className="flex items-center gap-3 py-2.5">
                    <Avatar name={entry.actor?.name ?? "System"} size="sm" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm text-text-primary">
                        {describeAuditAction(entry.action)}
                      </p>
                      <p className="truncate text-xs text-text-secondary">
                        {entry.actor?.name ?? "System"} ·{" "}
                        {formatClinicDateTime(entry.createdAt, timeZone)}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
