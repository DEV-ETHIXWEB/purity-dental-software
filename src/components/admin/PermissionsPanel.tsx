"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/Card";
import { setStaffPermission } from "@/lib/actions/manage-staff";
import {
  PERMISSIONS,
  PERMISSION_GROUPS,
  PERMISSION_KEYS,
  parseOverrides,
  roleHasByDefault,
  type PermissionKey,
} from "@/lib/auth/permissions";
import { ROLE_LABELS } from "@/lib/staff-format";
import type { UserRole } from "@/generated/prisma/client";
import { cn } from "@/lib/cn";

type Choice = "default" | "allow" | "deny";

/**
 * Three states, not a switch.
 *
 * A two-state toggle would have to write an override for every permission,
 * which silently freezes that person against future changes to their role's
 * defaults. Keeping "Use role default" as a distinct, returnable state means
 * an override is only ever recorded where someone deliberately made an
 * exception — and the list of exceptions stays meaningful.
 */
const CHOICES: { value: Choice; label: string }[] = [
  { value: "default", label: "Default" },
  { value: "allow", label: "Allow" },
  { value: "deny", label: "Deny" },
];

export interface PermissionsPanelProps {
  userId: string;
  role: UserRole;
  permissionOverrides: unknown;
  /** True when the row belongs to the signed-in admin, which restricts self-edits. */
  isSelf: boolean;
}

export function PermissionsPanel({
  userId,
  role,
  permissionOverrides,
  isSelf,
}: PermissionsPanelProps) {
  const router = useRouter();
  const [overrides, setOverrides] = useState(() => parseOverrides(permissionOverrides));
  const [busy, setBusy] = useState<PermissionKey | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  function choiceFor(key: PermissionKey): Choice {
    const override = overrides[key];
    if (override === true) return "allow";
    if (override === false) return "deny";
    return "default";
  }

  async function choose(key: PermissionKey, choice: Choice) {
    if (busy) return;
    const previous = overrides;
    const next = { ...overrides };
    if (choice === "default") delete next[key];
    else next[key] = choice === "allow";

    setOverrides(next);
    setBusy(key);
    setNotice(null);

    const result = await setStaffPermission({
      userId,
      permission: key,
      value: choice === "default" ? null : choice === "allow",
    });

    if (result.ok) {
      setNotice("Saved.");
      router.refresh();
    } else {
      setOverrides(previous);
      setNotice(result.error ?? "Couldn't update that permission.");
    }
    setBusy(null);
  }

  const exceptionCount = PERMISSION_KEYS.filter((k) => overrides[k] !== undefined).length;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Permissions</CardTitle>
        <CardDescription>
          {exceptionCount === 0
            ? `Using the ${ROLE_LABELS[role].toLowerCase()} defaults for everything.`
            : `${exceptionCount} ${exceptionCount === 1 ? "exception" : "exceptions"} to the ${ROLE_LABELS[role].toLowerCase()} defaults.`}
        </CardDescription>
      </CardHeader>
      {/* Groups flow into two columns once there is room, so the card does
          not become one very long ladder on a wide screen. */}
      <CardContent className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {PERMISSION_GROUPS.map((group) => {
          const keys = PERMISSION_KEYS.filter((k) => PERMISSIONS[k].group === group);
          if (keys.length === 0) return null;

          return (
            <section key={group} className="flex flex-col gap-2">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-text-secondary">
                {group}
              </h3>

              <ul className="flex flex-col divide-y divide-border rounded-[var(--radius-md)] border border-border">
                {keys.map((key) => {
                  const permission = PERMISSIONS[key];
                  const byDefault = roleHasByDefault(role, key);
                  const choice = choiceFor(key);
                  const effective = choice === "default" ? byDefault : choice === "allow";
                  // Removing your own permission management locks you out with
                  // no in-app way back, so the server refuses it — say so here
                  // rather than letting the click fail.
                  const locked = isSelf && key === "permissions.manage";

                  return (
                    <li
                      key={key}
                      className="flex flex-col gap-2 p-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4"
                    >
                      <div className="min-w-0">
                        <p className="flex flex-wrap items-center gap-2 text-sm text-text-primary">
                          {permission.label}
                          <span
                            className={cn(
                              "rounded-full px-2 py-0.5 text-[11px] font-medium",
                              effective
                                ? "bg-success-bg text-success-text"
                                : "bg-surface-sunken text-text-secondary",
                            )}
                          >
                            {effective ? "Allowed" : "Not allowed"}
                          </span>
                        </p>
                        <p className="mt-0.5 text-xs text-text-secondary">
                          {permission.description}{" "}
                          <span className="text-text-secondary">
                            {ROLE_LABELS[role]} default: {byDefault ? "allowed" : "not allowed"}.
                          </span>
                        </p>
                      </div>

                      <div
                        role="radiogroup"
                        aria-label={`${permission.label} for this staff member`}
                        className="flex shrink-0 rounded-[var(--radius-md)] border border-border p-0.5"
                      >
                        {CHOICES.map((option) => {
                          const selected = choice === option.value;
                          return (
                            <button
                              key={option.value}
                              type="button"
                              role="radio"
                              aria-checked={selected}
                              disabled={locked || busy === key}
                              onClick={() => choose(key, option.value)}
                              className={cn(
                                // 44px floor on phones: three of these sit
                                // side by side and they decide what a staff
                                // member is allowed to do, so a mis-tap is
                                // expensive. See Button's size classes.
                                "min-h-11 px-3 sm:min-h-8 sm:px-2.5",
                                "inline-flex items-center justify-center rounded-[var(--radius-sm)] text-xs font-medium transition-colors duration-200 ease-out",
                                "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-brand-blue)]",
                                selected
                                  ? "bg-[var(--color-brand-blue)] text-white"
                                  : "text-text-secondary hover:bg-surface-muted",
                                (locked || busy === key) && "cursor-not-allowed opacity-50",
                              )}
                            >
                              {option.label}
                            </button>
                          );
                        })}
                      </div>
                    </li>
                  );
                })}
              </ul>
            </section>
          );
        })}

        <p aria-live="polite" className="text-xs text-text-secondary lg:col-span-2">
          {notice ?? "Changes save automatically."}
        </p>
      </CardContent>
    </Card>
  );
}
