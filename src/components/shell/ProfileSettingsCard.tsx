"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Loader2 } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Avatar } from "@/components/ui/Avatar";
import { updateMyProfile } from "@/lib/actions/update-account";

export interface ProfileSettingsCardProps {
  name: string;
  email: string;
  phone: string;
  roleLabel: string;
  photoUrl?: string | null;
  /** Extra read-only field shown after Role (e.g. the Patient portal's date of birth). */
  extraReadOnlyField?: { label: string; value: string };
}

/**
 * Shared "Profile" settings card + real save action, used by all 4 portals'
 * Settings pages. Email is read-only here (changing a login email is a
 * bigger, security-sensitive flow — uniqueness, re-verification — out of
 * scope for a simple profile-details save); name and phone persist via
 * `updateMyProfile`.
 */
export function ProfileSettingsCard({ name: initialName, email, phone: initialPhone, roleLabel, photoUrl, extraReadOnlyField }: ProfileSettingsCardProps) {
  const router = useRouter();
  const [name, setName] = useState(initialName);
  const [phone, setPhone] = useState(initialPhone);
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

  async function handleSave() {
    setStatus("saving");
    setError(null);
    const result = await updateMyProfile({ name, phone });
    if (result.ok) {
      setStatus("saved");
      router.refresh();
      window.setTimeout(() => setStatus("idle"), 2000);
    } else {
      setStatus("error");
      setError(result.error ?? "Something went wrong.");
    }
  }

  return (
    <Card className="animate-rise-in stagger-1 transition-shadow duration-300 ease-out hover:shadow-card-hover">
      <CardHeader>
        <CardTitle>Profile</CardTitle>
        <CardDescription>This information is visible to your care team.</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-5">
        <div className="group/photo flex items-center gap-4">
          <Avatar
            name={name || initialName}
            src={photoUrl}
            size="lg"
            className="ring-0 ring-[var(--color-brand-blue)]/20 transition-all duration-300 ease-out group-hover/photo:scale-105 group-hover/photo:ring-4"
          />
          <Button variant="outline" size="sm" className="min-h-11 transition-all duration-200 ease-out" disabled>
            Change photo
          </Button>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Input label="Full name" value={name} onChange={(e) => setName(e.target.value)} className="transition-colors duration-200 ease-out hover:border-border-strong focus:border-[var(--color-brand-blue)]" />
          <Input label="Role" defaultValue={roleLabel} disabled />
          <Input label="Email" type="email" defaultValue={email} disabled hint="Contact support to change your login email." />
          <Input label="Phone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} className="transition-colors duration-200 ease-out hover:border-border-strong focus:border-[var(--color-brand-blue)]" />
          {extraReadOnlyField && (
            <Input label={extraReadOnlyField.label} defaultValue={extraReadOnlyField.value} disabled />
          )}
        </div>
        {error && (
          <p role="alert" className="animate-rise-in text-sm text-error">
            {error}
          </p>
        )}
        <div className="flex items-center gap-3">
          <Button
            onClick={handleSave}
            disabled={status === "saving"}
            className="min-h-11 self-start transition-all duration-200 ease-out hover:shadow-card-hover active:scale-[0.98] motion-reduce:active:scale-100"
          >
            {status === "saving" ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin motion-reduce:animate-none" aria-hidden="true" />
                Saving…
              </>
            ) : status === "saved" ? (
              <>
                <Check className="animate-pop-in h-4 w-4" aria-hidden="true" />
                Saved
              </>
            ) : (
              "Save changes"
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
