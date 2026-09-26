"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import {
  updateStaffMember,
  setStaffRole,
  setStaffActive,
  resetStaffPassword,
} from "@/lib/actions/manage-staff";
import { STAFF_ROLES, ROLE_LABELS, type StaffMember } from "@/lib/staff-format";
import type { UserRole } from "@/generated/prisma/client";
import { cn } from "@/lib/cn";

const FIELD_CLASSES =
  "h-10 w-full rounded-[var(--radius-md)] border border-border bg-surface px-3 text-sm text-text-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-brand-blue)]";

function suggestPassword(): string {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789";
  const bytes = new Uint32Array(16);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (n) => alphabet[n % alphabet.length]).join("");
}

export function StaffDetailsPanel({ member, isSelf }: { member: StaffMember; isSelf: boolean }) {
  const router = useRouter();

  const [name, setName] = useState(member.name);
  const [email, setEmail] = useState(member.email);
  const [phone, setPhone] = useState(member.phone ?? "");
  const [detailsStatus, setDetailsStatus] = useState<string | null>(null);
  const [savingDetails, setSavingDetails] = useState(false);

  const [role, setRole] = useState<UserRole>(member.role);
  const [roleStatus, setRoleStatus] = useState<string | null>(null);

  const [newPassword, setNewPassword] = useState("");
  const [passwordStatus, setPasswordStatus] = useState<string | null>(null);

  const [accessStatus, setAccessStatus] = useState<string | null>(null);
  const [confirmingDeactivate, setConfirmingDeactivate] = useState(false);

  async function saveDetails(e: FormEvent) {
    e.preventDefault();
    if (savingDetails) return;
    setSavingDetails(true);
    setDetailsStatus(null);
    const result = await updateStaffMember({ userId: member.id, name, email, phone });
    setDetailsStatus(result.ok ? "Saved." : (result.error ?? "Couldn't save those changes."));
    if (result.ok) router.refresh();
    setSavingDetails(false);
  }

  async function changeRole(next: UserRole) {
    const previous = role;
    setRole(next);
    setRoleStatus(null);
    const result = await setStaffRole({ userId: member.id, role: next });
    if (result.ok) {
      setRoleStatus("Role updated.");
      router.refresh();
    } else {
      setRole(previous);
      setRoleStatus(result.error ?? "Couldn't change that role.");
    }
  }

  async function changeActive(next: boolean) {
    setAccessStatus(null);
    const result = await setStaffActive({ userId: member.id, isActive: next });
    if (result.ok) {
      setAccessStatus(next ? "Account reactivated." : "Account deactivated.");
      setConfirmingDeactivate(false);
      router.refresh();
    } else {
      setAccessStatus(result.error ?? "Couldn't update that account.");
    }
  }

  async function resetPassword(e: FormEvent) {
    e.preventDefault();
    setPasswordStatus(null);
    const result = await resetStaffPassword({ userId: member.id, password: newPassword });
    if (result.ok) {
      setPasswordStatus("Password reset. Give them the new one — they've been signed out.");
      setNewPassword("");
    } else {
      setPasswordStatus(result.error ?? "Couldn't reset that password.");
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardContent className="flex flex-col gap-4">
          <div className="flex items-center gap-4">
            <Avatar
              name={member.name}
              src={member.avatarUrl}
              size="lg"
              className={cn(!member.isActive && "opacity-60")}
            />
            <div className="min-w-0">
              <p className="truncate text-lg font-semibold text-text-primary">{member.name}</p>
              <p className="mt-1 flex flex-wrap items-center gap-2">
                <Badge tone={member.isActive ? "success" : "neutral"}>
                  {member.isActive ? "Active" : "Deactivated"}
                </Badge>
                <span className="text-sm text-text-secondary">{ROLE_LABELS[member.role]}</span>
                {isSelf && <span className="text-xs text-text-secondary">· This is you</span>}
              </p>
            </div>
          </div>

          <form onSubmit={saveDetails} className="flex flex-col gap-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <label className="flex flex-col gap-1.5">
                <span className="text-sm font-medium text-text-primary">Full name</span>
                <Input value={name} onChange={(e) => setName(e.target.value)} required />
              </label>
              <label className="flex flex-col gap-1.5">
                <span className="text-sm font-medium text-text-primary">Email</span>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </label>
              <label className="flex flex-col gap-1.5">
                <span className="text-sm font-medium text-text-primary">Phone</span>
                <Input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} />
              </label>
              <label className="flex flex-col gap-1.5">
                <span className="text-sm font-medium text-text-primary">Role</span>
                <select
                  value={role}
                  onChange={(e) => changeRole(e.target.value as UserRole)}
                  className={FIELD_CLASSES}
                  aria-label={`Role for ${member.name}`}
                >
                  {STAFF_ROLES.map((r) => (
                    <option key={r} value={r}>
                      {ROLE_LABELS[r]}
                    </option>
                  ))}
                </select>
                <span aria-live="polite" className="text-xs text-text-secondary">
                  {roleStatus ?? "Changing the role changes their default permissions."}
                </span>
              </label>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <Button type="submit" disabled={savingDetails}>
                {savingDetails ? "Saving…" : "Save details"}
              </Button>
              <span aria-live="polite" className="text-xs text-text-secondary">
                {detailsStatus}
              </span>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Password</CardTitle>
          <CardDescription>
            For when someone is locked out. Setting a new one signs them out everywhere.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={resetPassword} className="flex flex-col gap-3">
            <div className="flex flex-col gap-2 sm:flex-row">
              <Input
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                minLength={12}
                required
                autoComplete="off"
                placeholder="New password (at least 12 characters)"
                className="flex-1 font-mono"
              />
              <Button
                type="button"
                variant="outline"
                onClick={() => setNewPassword(suggestPassword())}
                className="shrink-0"
              >
                Generate
              </Button>
              <Button type="submit" variant="secondary" className="shrink-0">
                Reset password
              </Button>
            </div>
            <p aria-live="polite" className="text-xs text-text-secondary">
              {passwordStatus}
            </p>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Account access</CardTitle>
          <CardDescription>
            Deactivating ends their sessions immediately and blocks sign-in. Nothing is deleted —
            their appointments, invoices and history stay attached to them.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          {member.isActive ? (
            confirmingDeactivate ? (
              <div className="flex flex-wrap items-center gap-3">
                <span className="text-sm text-text-primary">
                  Deactivate {member.name}&apos;s account?
                </span>
                <Button variant="danger" onClick={() => changeActive(false)}>
                  Yes, deactivate
                </Button>
                <Button variant="ghost" onClick={() => setConfirmingDeactivate(false)}>
                  Cancel
                </Button>
              </div>
            ) : (
              <Button
                variant="outline"
                className="self-start"
                disabled={isSelf}
                onClick={() => setConfirmingDeactivate(true)}
              >
                Deactivate account
              </Button>
            )
          ) : (
            <Button variant="secondary" className="self-start" onClick={() => changeActive(true)}>
              Reactivate account
            </Button>
          )}

          <p aria-live="polite" className="text-xs text-text-secondary">
            {accessStatus ?? (isSelf ? "You can't deactivate your own account." : null)}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
