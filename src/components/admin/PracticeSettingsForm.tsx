"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { updatePractice } from "@/lib/actions/update-practice";

const FIELD_CLASSES =
  "h-10 w-full rounded-[var(--radius-md)] border border-border bg-surface px-3 text-sm text-text-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-brand-blue)]";

/**
 * Offered zones.
 *
 * A short curated list rather than every IANA zone: this is a dental
 * practice picking where it is, and a 400-entry dropdown is worse at that
 * job than a dozen. The server validates whatever arrives against
 * `Intl.DateTimeFormat`, so the list being short doesn't make it a
 * trust boundary — it's a convenience, not the check.
 */
const COMMON_ZONES = [
  "America/New_York",
  "America/Chicago",
  "America/Denver",
  "America/Phoenix",
  "America/Los_Angeles",
  "America/Anchorage",
  "Pacific/Honolulu",
  "America/Toronto",
  "Europe/London",
  "Europe/Dublin",
  "Asia/Kolkata",
  "Australia/Sydney",
  "UTC",
];

export interface PracticeSettingsFormProps {
  name: string;
  timezone: string;
  phone: string;
  email: string;
  addressLine: string;
}

export function PracticeSettingsForm(initial: PracticeSettingsFormProps) {
  const router = useRouter();
  const [name, setName] = useState(initial.name);
  const [timezone, setTimezone] = useState(initial.timezone);
  const [phone, setPhone] = useState(initial.phone);
  const [email, setEmail] = useState(initial.email);
  const [addressLine, setAddressLine] = useState(initial.addressLine);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<string | null>(null);

  // A saved zone that isn't in the curated list still has to be selectable,
  // or opening this form would silently offer to change it.
  const zones = COMMON_ZONES.includes(timezone) ? COMMON_ZONES : [timezone, ...COMMON_ZONES];

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (saving) return;
    setSaving(true);
    setStatus(null);
    const result = await updatePractice({ name, timezone, phone, email, addressLine });
    setStatus(result.ok ? "Saved." : (result.error ?? "Couldn't save practice settings."));
    if (result.ok) router.refresh();
    setSaving(false);
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Practice details</CardTitle>
          <CardDescription>
            The name and contact details shown across the app and on invoices.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <label className="flex flex-col gap-1.5 sm:col-span-2">
            <span className="text-sm font-medium text-text-primary">Practice name</span>
            <Input value={name} onChange={(e) => setName(e.target.value)} required />
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-medium text-text-primary">Phone</span>
            <Input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} />
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-medium text-text-primary">Email</span>
            <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          </label>

          <label className="flex flex-col gap-1.5 sm:col-span-2">
            <span className="text-sm font-medium text-text-primary">Address</span>
            <Input
              value={addressLine}
              onChange={(e) => setAddressLine(e.target.value)}
              placeholder="221 Baker Street, Suite 4"
            />
          </label>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Timezone</CardTitle>
          <CardDescription>
            Every appointment time and record date in all four portals is shown in this zone.
            Appointments themselves are stored as absolute instants, so changing this re-labels
            existing bookings rather than moving them.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <label className="flex flex-col gap-1.5 sm:max-w-sm">
            <span className="text-sm font-medium text-text-primary">Clinic timezone</span>
            <select
              value={timezone}
              onChange={(e) => setTimezone(e.target.value)}
              className={FIELD_CLASSES}
              aria-label="Clinic timezone"
            >
              {zones.map((zone) => (
                <option key={zone} value={zone}>
                  {zone.replace(/_/g, " ")}
                </option>
              ))}
            </select>
          </label>
        </CardContent>
      </Card>

      <div className="flex flex-wrap items-center gap-3">
        <Button type="submit" disabled={saving}>
          {saving ? "Saving…" : "Save practice settings"}
        </Button>
        <span aria-live="polite" className="text-sm text-text-secondary">
          {status}
        </span>
      </div>
    </form>
  );
}
