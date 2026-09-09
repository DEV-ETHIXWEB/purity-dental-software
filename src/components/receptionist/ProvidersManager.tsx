"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Copy, Loader2, Pencil, Plus, UserPlus, X } from "lucide-react";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { cn } from "@/lib/cn";
import { createProvider, updateProvider, setProviderActive } from "@/lib/actions/manage-providers";
import type { User, UserRole } from "@/generated/prisma/client";

export interface ProvidersManagerProps {
  providers: User[];
}

const ROLE_LABEL: Record<string, string> = { DENTIST: "Dentist", HYGIENIST: "Hygienist" };
const STAGGER = ["stagger-0", "stagger-1", "stagger-2", "stagger-3", "stagger-4", "stagger-5"];

const SELECT_CLASSES =
  "h-10 rounded-[var(--radius-md)] border border-border bg-surface px-3 text-sm text-text-primary transition-colors duration-200 ease-out hover:border-border-strong focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-brand-blue)]";
const FIELD_CLASSES =
  "transition-colors duration-200 ease-out hover:border-border-strong focus:border-[var(--color-brand-blue)]";

/**
 * The clinical side of the front desk's "Doctor & patient management":
 * add a dentist or hygienist, correct their details, and switch an account
 * off when they leave.
 *
 * A new account's temporary password is shown exactly once, right after it's
 * created — it is never stored in readable form, so there is no screen that
 * can show it again.
 */
export function ProvidersManager({ providers }: ProvidersManagerProps) {
  const router = useRouter();
  const [adding, setAdding] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tempPassword, setTempPassword] = useState<{ email: string; password: string } | null>(null);
  const [copied, setCopied] = useState(false);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<UserRole>("DENTIST");

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [togglingId, setTogglingId] = useState<string | null>(null);

  async function handleCreate(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    setBusy(true);
    setError(null);
    const result = await createProvider({ name, email, role });
    setBusy(false);
    if (result.ok) {
      setTempPassword({ email: email.trim().toLowerCase(), password: result.temporaryPassword ?? "" });
      setName("");
      setEmail("");
      setRole("DENTIST");
      setAdding(false);
      router.refresh();
    } else {
      setError(result.error ?? "Couldn't add that clinician.");
    }
  }

  function startEdit(provider: User) {
    setEditingId(provider.id);
    setEditName(provider.name);
    setEditEmail(provider.email);
    setError(null);
  }

  async function handleSaveEdit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!editingId || busy) return;
    setBusy(true);
    setError(null);
    const result = await updateProvider({ providerId: editingId, name: editName, email: editEmail });
    setBusy(false);
    if (result.ok) {
      setEditingId(null);
      router.refresh();
    } else {
      setError(result.error ?? "Couldn't save those changes.");
    }
  }

  async function handleToggle(provider: User) {
    setTogglingId(provider.id);
    setError(null);
    const result = await setProviderActive(provider.id, !provider.isActive);
    setTogglingId(null);
    if (result.ok) router.refresh();
    else setError(result.error ?? "Couldn't update that account.");
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm text-text-secondary">
          {providers.length} clinician{providers.length === 1 ? "" : "s"} on the team
        </p>
        <Button
          onClick={() => {
            setAdding((v) => !v);
            setError(null);
          }}
          aria-expanded={adding}
          className="min-h-11 transition-all duration-200 ease-out hover:shadow-card-hover active:scale-[0.98] motion-reduce:active:scale-100"
        >
          {adding ? <X className="h-4 w-4" aria-hidden="true" /> : <UserPlus className="h-4 w-4" aria-hidden="true" />}
          {adding ? "Cancel" : "Add clinician"}
        </Button>
      </div>

      {tempPassword && (
        <div className="animate-scale-in flex flex-col gap-2 rounded-[var(--radius-lg)] border border-[var(--color-brand-blue)] bg-info-bg p-4">
          <p className="text-sm font-semibold text-text-primary">Account created</p>
          <p className="text-sm text-text-secondary">
            Give <strong className="text-text-primary">{tempPassword.email}</strong> this one-time
            password. It won&apos;t be shown again — they can change it from Settings.
          </p>
          <div className="flex flex-wrap items-center gap-2">
            <code className="rounded-[var(--radius-md)] border border-border bg-surface px-3 py-2 font-mono text-sm text-text-primary">
              {tempPassword.password}
            </code>
            <Button
              variant="outline"
              size="sm"
              className="min-h-11"
              onClick={async () => {
                try {
                  await navigator.clipboard.writeText(tempPassword.password);
                  setCopied(true);
                  window.setTimeout(() => setCopied(false), 2000);
                } catch {
                  setCopied(false);
                }
              }}
            >
              {copied ? <Check className="h-4 w-4" aria-hidden="true" /> : <Copy className="h-4 w-4" aria-hidden="true" />}
              {copied ? "Copied" : "Copy"}
            </Button>
            <Button variant="ghost" size="sm" className="min-h-11" onClick={() => setTempPassword(null)}>
              Done
            </Button>
          </div>
        </div>
      )}

      {adding && (
        <form
          onSubmit={handleCreate}
          className="animate-scale-in flex flex-col gap-3 rounded-[var(--radius-lg)] border border-border bg-surface p-4 shadow-card"
        >
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <Input
              label="Full name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Dr. Raj Kapoor"
              required
              className={FIELD_CLASSES}
            />
            <Input
              label="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="raj.kapoor@purity.dev"
              required
              className={FIELD_CLASSES}
            />
            <div className="flex flex-col gap-1.5">
              <label htmlFor="provider-role" className="text-sm font-medium text-text-primary">
                Role
              </label>
              <select
                id="provider-role"
                value={role}
                onChange={(e) => setRole(e.target.value as UserRole)}
                className={SELECT_CLASSES}
              >
                <option value="DENTIST">Dentist</option>
                <option value="HYGIENIST">Hygienist</option>
              </select>
            </div>
          </div>
          {error && (
            <p role="alert" className="animate-rise-in text-sm text-error">
              {error}
            </p>
          )}
          <Button
            type="submit"
            disabled={busy}
            className="min-h-11 self-start transition-all duration-200 ease-out hover:shadow-card-hover active:scale-[0.98] motion-reduce:active:scale-100"
          >
            {busy ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin motion-reduce:animate-none" aria-hidden="true" />
                Creating…
              </>
            ) : (
              <>
                <Plus className="h-4 w-4" aria-hidden="true" />
                Create account
              </>
            )}
          </Button>
        </form>
      )}

      {error && !adding && !editingId && (
        <p role="alert" className="animate-rise-in text-sm text-error">
          {error}
        </p>
      )}

      <ul className="flex flex-col gap-2">
        {providers.map((provider, i) => (
          <li
            key={provider.id}
            className={cn(
              "animate-rise-in flex flex-wrap items-center gap-x-3 gap-y-3 rounded-[var(--radius-lg)] border border-border bg-surface p-3 shadow-card",
              "transition-all duration-200 ease-out hover:-translate-y-0.5 hover:border-border-strong hover:shadow-card-hover motion-reduce:hover:translate-y-0",
              !provider.isActive && "opacity-70",
              STAGGER[i] ?? "stagger-5",
            )}
          >
            {editingId === provider.id ? (
              <form onSubmit={handleSaveEdit} className="flex w-full flex-col gap-3">
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <Input
                    label="Full name"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    required
                    className={FIELD_CLASSES}
                  />
                  <Input
                    label="Email"
                    type="email"
                    value={editEmail}
                    onChange={(e) => setEditEmail(e.target.value)}
                    required
                    className={FIELD_CLASSES}
                  />
                </div>
                {error && (
                  <p role="alert" className="animate-rise-in text-sm text-error">
                    {error}
                  </p>
                )}
                <div className="flex flex-wrap gap-2">
                  <Button type="submit" size="sm" disabled={busy} className="min-h-11">
                    {busy && <Loader2 className="h-4 w-4 animate-spin motion-reduce:animate-none" aria-hidden="true" />}
                    Save
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="min-h-11"
                    onClick={() => setEditingId(null)}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            ) : (
              <>
                <Avatar name={provider.name} src={provider.avatarUrl ?? undefined} size="sm" />
                <div className="min-w-0 flex-1 basis-44">
                  <p className="truncate text-sm font-medium text-text-primary">{provider.name}</p>
                  <p className="truncate text-xs text-text-secondary">{provider.email}</p>
                </div>
                <Badge tone={provider.role === "DENTIST" ? "brand-blue" : "brand-teal"} className="shrink-0">
                  {ROLE_LABEL[provider.role] ?? provider.role}
                </Badge>
                <Badge tone={provider.isActive ? "success" : "neutral"} className="shrink-0">
                  {provider.isActive ? "Active" : "Disabled"}
                </Badge>
                <div className="flex shrink-0 gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="min-h-11"
                    onClick={() => startEdit(provider)}
                    aria-label={`Edit ${provider.name}`}
                  >
                    <Pencil className="h-4 w-4" aria-hidden="true" />
                    Edit
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="min-h-11"
                    disabled={togglingId === provider.id}
                    onClick={() => handleToggle(provider)}
                  >
                    {togglingId === provider.id && (
                      <Loader2 className="h-4 w-4 animate-spin motion-reduce:animate-none" aria-hidden="true" />
                    )}
                    {provider.isActive ? "Disable" : "Enable"}
                  </Button>
                </div>
              </>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
