"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Loader2 } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Avatar } from "@/components/ui/Avatar";
import { updateMyProfile } from "@/lib/actions/update-account";
import { updateProfilePhoto } from "@/lib/actions/update-profile-photo";
import { setPresence } from "@/lib/actions/set-presence";
import { cn } from "@/lib/cn";
import type { UserPresence } from "@/generated/prisma/client";

export interface ProfileSettingsCardProps {
  name: string;
  email: string;
  phone: string;
  roleLabel: string;
  photoUrl?: string | null;
  /** Current presence. Omit to hide the availability toggle entirely (the Patient portal has no use for it). */
  presence?: UserPresence | null;
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
export function ProfileSettingsCard({ name: initialName, email, phone: initialPhone, roleLabel, photoUrl, presence, extraReadOnlyField }: ProfileSettingsCardProps) {
  const router = useRouter();
  const [name, setName] = useState(initialName);
  const [phone, setPhone] = useState(initialPhone);
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

  const photoInputRef = useRef<HTMLInputElement>(null);
  const [photoStatus, setPhotoStatus] = useState<"idle" | "uploading" | "error">("idle");
  const [photoError, setPhotoError] = useState<string | null>(null);

  // Applied straight away so the dot answers the click, and rolled back if
  // the write fails rather than leaving a wrong status on screen.
  const [currentPresence, setCurrentPresence] = useState<UserPresence>(presence ?? "AVAILABLE");
  const [presenceBusy, setPresenceBusy] = useState(false);

  async function togglePresence() {
    if (presenceBusy) return;
    const previous = currentPresence;
    const next: UserPresence = previous === "AVAILABLE" ? "AWAY" : "AVAILABLE";
    setCurrentPresence(next);
    setPresenceBusy(true);
    const result = await setPresence(next);
    setPresenceBusy(false);
    if (result.ok) router.refresh();
    else setCurrentPresence(previous);
  }

  async function handlePhotoChange(file: File | undefined) {
    if (!file) return;
    setPhotoStatus("uploading");
    setPhotoError(null);

    const formData = new FormData();
    formData.append("photo", file);
    const result = await updateProfilePhoto(formData);

    // Cleared either way, so picking the same file again still fires onChange.
    if (photoInputRef.current) photoInputRef.current.value = "";

    if (result.ok) {
      setPhotoStatus("idle");
      router.refresh();
    } else {
      setPhotoStatus("error");
      setPhotoError(result.error ?? "Couldn't upload that photo.");
    }
  }

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
      {/*
       * Two columns from `sm:` up, the way GitHub lays a profile out: the
       * portrait and everything about the person on the left, the editable
       * fields on the right. On a phone it stacks — a 96px avatar beside a
       * form field leaves neither enough room.
       */}
      <CardContent className="flex flex-col gap-6 sm:flex-row sm:gap-8">
        <div className="flex shrink-0 flex-col items-center gap-3 sm:w-52">
          <div className="group/photo relative">
            {/*
              * No `presence` passed here on purpose. The toggle below is the
              * indicator — handing the Avatar one too painted a second dot
              * underneath it, offset by a few pixels, which read as a smudge
              * on the corner rather than a status.
              */}
            <Avatar
              name={name || initialName}
              src={photoUrl}
              size="2xl"
              className="ring-0 ring-[var(--color-brand-blue)]/20 transition-all duration-300 ease-out group-hover/photo:ring-4"
            />

            {presence && (
              /*
               * Sits on the avatar's lower-right corner, over the dot it
               * controls — the control and the thing it changes in one
               * place. It carries its own label because the dot alone is a
               * colour, which is not something a screen reader can read.
               */
              <button
                type="button"
                onClick={togglePresence}
                disabled={presenceBusy}
                aria-pressed={currentPresence === "AWAY"}
                aria-label={`You are ${currentPresence === "AVAILABLE" ? "available" : "away"} — click to set yourself ${currentPresence === "AVAILABLE" ? "away" : "available"}`}
                className={cn(
                  /*
                   * Tangent to the circle at 4:30, not hung off the bounding
                   * box. For a 8rem avatar the 45° point lands 6.83rem in, so
                   * a 2.25rem control centred there sits flush at `right-0
                   * bottom-0` — no negative offsets, nothing poking out.
                   */
                  "absolute bottom-0 right-0 h-9 w-9 rounded-full border border-border bg-surface shadow-card",
                  "transition-transform duration-200 ease-out hover:scale-110 active:scale-95 motion-reduce:hover:scale-100 motion-reduce:active:scale-100",
                  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-brand-blue)]",
                )}
              >
                <span
                  aria-hidden="true"
                  className={cn(
                    "mx-auto block h-4 w-4 rounded-full",
                    currentPresence === "AVAILABLE"
                      ? "bg-[var(--color-success)]"
                      : "bg-[var(--color-warning)]",
                  )}
                />
              </button>
            )}
          </div>

          {presence && (
            <p aria-live="polite" className="text-sm font-medium text-text-primary">
              {currentPresence === "AVAILABLE" ? "Available" : "Away"}
            </p>
          )}

          {/*
            * The button below is the real control; this input only opens the
            * file picker for it. A bare file input can't be styled to match,
            * and `accept` keeps the picker to the formats the action takes.
            *
            * `aria-hidden` + `tabIndex={-1}` rather than just `sr-only`:
            * visually-hidden still leaves it focusable and in the
            * accessibility tree, so a screen reader met an unlabelled file
            * input and keyboard users tabbed through two controls for one
            * action. Hidden from both, "Change photo" is the single control
            * and it already carries the name.
            */}
          <input
            ref={photoInputRef}
            id="profile-photo"
            type="file"
            accept="image/png,image/jpeg,image/webp"
            className="sr-only"
            aria-hidden="true"
            tabIndex={-1}
            onChange={(e) => handlePhotoChange(e.target.files?.[0])}
          />
          <Button
            variant="outline"
            size="sm"
            className="min-h-11 w-full justify-center transition-all duration-200 ease-out"
            disabled={photoStatus === "uploading"}
            onClick={() => photoInputRef.current?.click()}
          >
            {photoStatus === "uploading" ? "Uploading…" : "Change photo"}
          </Button>
          <p
            aria-live="polite"
            className={cn("text-center text-xs", photoError ? "text-error" : "text-text-secondary")}
          >
            {photoError ?? "PNG, JPEG or WebP · up to 5MB"}
          </p>
        </div>

        <div className="flex min-w-0 flex-1 flex-col gap-5">
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
        </div>
      </CardContent>
    </Card>
  );
}
