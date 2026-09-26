"use client";

import { useState } from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/Card";
import { updateNotificationPreferences } from "@/lib/actions/update-notification-preferences";
import { cn } from "@/lib/cn";

export interface NotificationPreferenceItem {
  id: string;
  label: string;
}

export interface NotificationPreferencesCardProps {
  items: NotificationPreferenceItem[];
  /** Card subtitle — staff portals phrase this differently from the Patient portal. */
  description: string;
  /**
   * Saved toggle states, keyed by item id. A missing key means "on": the
   * product default is to notify, so an account that has never opened
   * Settings behaves exactly as it did before preferences were stored.
   */
  preferences?: Record<string, boolean>;
  /**
   * "comfortable" enlarges the row and checkbox for the Patient portal,
   * which is the most touch-heavy surface. Defaults to the staff sizing.
   */
  size?: "default" | "comfortable";
}

/** Rows animate in just behind their card, so the group reads as one settling motion. */
const ROW_STAGGER = ["stagger-3", "stagger-4", "stagger-5", "stagger-6", "stagger-7", "stagger-8"];

/**
 * Shared "Notifications" preferences card for all four portals' Settings
 * pages, which previously carried four byte-identical copies of this markup
 * (bar the Patient portal's larger touch targets).
 *
 * The toggles used to be presentational — `defaultChecked`, saving nothing,
 * with a line of small print admitting it. They now persist through
 * `updateNotificationPreferences` on change, with no Save button: there is
 * one value per switch and nothing to review before committing it.
 */
export function NotificationPreferencesCard({
  items,
  description,
  preferences = {},
  size = "default",
}: NotificationPreferencesCardProps) {
  const comfortable = size === "comfortable";

  const [checked, setChecked] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(items.map((item) => [item.id, preferences[item.id] ?? true])),
  );
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");

  async function toggle(id: string, next: boolean) {
    // Applied first so the switch answers the tap immediately; rolled back
    // below if the write fails, rather than leaving a lie on screen.
    const previous = checked;
    const updated = { ...checked, [id]: next };
    setChecked(updated);
    setStatus("saving");

    const result = await updateNotificationPreferences(updated);
    if (result.ok) {
      setStatus("saved");
      window.setTimeout(() => setStatus((s) => (s === "saved" ? "idle" : s)), 2000);
    } else {
      setChecked(previous);
      setStatus("error");
    }
  }

  return (
    <Card className="animate-rise-in stagger-2 transition-shadow duration-300 ease-out hover:shadow-card-hover">
      <CardHeader>
        <CardTitle>Notifications</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        {items.map((item, i) => (
          <label
            key={item.id}
            htmlFor={item.id}
            className={cn(
              "group/row animate-rise-in flex cursor-pointer items-center justify-between gap-3 rounded-[var(--radius-md)] border border-border p-3 text-sm",
              "transition-all duration-200 ease-out hover:border-border-strong hover:bg-surface-muted hover:shadow-card",
              comfortable && "min-h-11",
              ROW_STAGGER[i] ?? "stagger-8",
            )}
          >
            <span className="text-text-primary">{item.label}</span>
            {/*
              * A real checkbox, visually hidden, with the track and knob
              * drawn as siblings off `peer-checked`. Keeping the native
              * input means space/enter, form semantics and focus all still
              * work for free; `role="switch"` is what makes a screen reader
              * say "on/off" rather than "checked", which is the right verb
              * for a setting that applies immediately.
              */}
            <span className={cn("relative inline-flex shrink-0", comfortable ? "h-7 w-12" : "h-6 w-11")}>
              <input
                id={item.id}
                type="checkbox"
                role="switch"
                aria-label={item.label}
                checked={checked[item.id] ?? true}
                onChange={(e) => toggle(item.id, e.target.checked)}
                className="peer absolute inset-0 z-10 m-0 cursor-pointer opacity-0"
              />
              <span
                aria-hidden="true"
                className={cn(
                  "pointer-events-none absolute inset-0 rounded-full bg-border-strong transition-colors duration-200 ease-out",
                  "peer-checked:bg-[var(--color-brand-blue)]",
                  "peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-[var(--color-brand-blue)]",
                )}
              />
              <span
                aria-hidden="true"
                className={cn(
                  "pointer-events-none absolute top-1/2 -translate-y-1/2 rounded-full bg-white shadow-card transition-transform duration-200 ease-out motion-reduce:transition-none",
                  comfortable ? "left-0.5 h-6 w-6 peer-checked:translate-x-5" : "left-0.5 h-5 w-5 peer-checked:translate-x-5",
                )}
              />
            </span>
          </label>
        ))}

        <p
          aria-live="polite"
          className={cn("text-xs", status === "error" ? "text-error" : "text-text-secondary")}
        >
          {status === "saving" && "Saving…"}
          {status === "saved" && "Preferences saved."}
          {status === "error" && "Couldn't save that change. Please try again."}
          {status === "idle" && "Changes save automatically."}
        </p>
      </CardContent>
    </Card>
  );
}
