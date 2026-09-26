"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { createStaffMember } from "@/lib/actions/manage-staff";
import { STAFF_ROLES, ROLE_LABELS } from "@/lib/staff-format";
import { defaultPermissionsForRole, PERMISSIONS } from "@/lib/auth/permissions";
import type { UserRole } from "@/generated/prisma/client";

const FIELD_CLASSES =
  "h-10 w-full rounded-[var(--radius-md)] border border-border bg-surface px-3 text-sm text-text-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-brand-blue)]";

/**
 * Suggests an initial password so an admin isn't tempted to reuse one across
 * new hires. Generated in the browser and shown once — it is handed to the
 * new user, who changes it from Settings. `crypto.getRandomValues` rather
 * than `Math.random`, which is not suitable for anything credential-shaped.
 */
function suggestPassword(): string {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789";
  const bytes = new Uint32Array(16);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (n) => alphabet[n % alphabet.length]).join("");
}

export function NewStaffForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [role, setRole] = useState<UserRole>("RECEPTIONIST");
  const [password, setPassword] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const grants = defaultPermissionsForRole(role);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (saving) return;
    setSaving(true);
    setError(null);

    const result = await createStaffMember({ name, email, phone, role, password });
    if (result.ok && result.userId) {
      router.push(`/admin/staff/${result.userId}`);
    } else {
      setError(result.error ?? "Couldn't add this staff member.");
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      <Card>
        <CardContent className="flex flex-col gap-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <label className="flex flex-col gap-1.5">
              <span className="text-sm font-medium text-text-primary">Full name</span>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                autoComplete="off"
                placeholder="Dr. Jane Okafor"
              />
            </label>

            <label className="flex flex-col gap-1.5">
              <span className="text-sm font-medium text-text-primary">Email</span>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="off"
                placeholder="jane.okafor@purity.dev"
              />
            </label>

            <label className="flex flex-col gap-1.5">
              <span className="text-sm font-medium text-text-primary">
                Phone <span className="font-normal text-text-secondary">(optional)</span>
              </span>
              <Input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                autoComplete="off"
                placeholder="(555) 010-3344"
              />
            </label>

            <label className="flex flex-col gap-1.5">
              <span className="text-sm font-medium text-text-primary">Role</span>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as UserRole)}
                className={FIELD_CLASSES}
              >
                {STAFF_ROLES.map((r) => (
                  <option key={r} value={r}>
                    {ROLE_LABELS[r]}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-medium text-text-primary">Initial password</span>
            <div className="flex flex-col gap-2 sm:flex-row">
              {/*
                * Shown in plain text rather than masked: the admin has to read
                * it back to the new hire, and a masked box they cannot check
                * invites typos into the one credential that account has.
                */}
              <Input
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={12}
                autoComplete="off"
                placeholder="At least 12 characters"
                className="flex-1 font-mono"
              />
              <Button
                type="button"
                variant="outline"
                onClick={() => setPassword(suggestPassword())}
                className="shrink-0"
              >
                Generate
              </Button>
            </div>
            <span className="text-xs text-text-secondary">
              Give this to them directly — they can change it from Settings once they sign in.
            </span>
          </label>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="flex flex-col gap-3">
          <div>
            <h2 className="text-[15px] font-semibold tracking-tight text-text-primary">
              What a {ROLE_LABELS[role].toLowerCase()} can do
            </h2>
            <p className="mt-1 text-sm text-text-secondary">
              These come with the role. You can add or remove individual permissions for this person
              once they&apos;re created.
            </p>
          </div>
          <ul className="flex flex-wrap gap-2">
            {grants.map((key) => (
              <li
                key={key}
                className="rounded-full border border-border bg-surface-muted px-3 py-1 text-xs text-text-secondary"
              >
                {PERMISSIONS[key].label}
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      {error && (
        <p role="alert" className="text-sm text-error-text">
          {error}
        </p>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <Button type="submit" disabled={saving}>
          {saving ? "Adding…" : "Add staff member"}
        </Button>
        <Link
          href="/admin/staff"
          className="text-sm text-text-secondary hover:text-text-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-brand-blue)]"
        >
          Cancel
        </Link>
      </div>
    </form>
  );
}
