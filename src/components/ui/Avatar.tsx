import Image from "next/image";
import { cn } from "@/lib/cn";
import type { UserPresence } from "@/generated/prisma/client";

export interface AvatarProps {
  name: string;
  src?: string | null;
  size?: "sm" | "md" | "lg" | "xl" | "2xl";
  className?: string;
  /** Draws a presence dot on the lower-right corner. Omit for patients and anywhere presence is meaningless. */
  presence?: UserPresence | null;
}

const sizeClasses = {
  sm: "h-8 w-8 text-xs",
  md: "h-10 w-10 text-sm",
  lg: "h-14 w-14 text-base",
  xl: "h-24 w-24 text-2xl",
  "2xl": "h-32 w-32 text-3xl",
};

const sizePx = { sm: 32, md: 40, lg: 56, xl: 96, "2xl": 128 };

/** The dot scales with the avatar, and the ring is the card behind it showing through. */
const dotClasses = {
  sm: "h-2.5 w-2.5 ring-2",
  md: "h-3 w-3 ring-2",
  lg: "h-4 w-4 ring-[3px]",
  xl: "h-6 w-6 ring-4",
  "2xl": "h-7 w-7 ring-4",
};

const PRESENCE_LABEL: Record<UserPresence, string> = {
  AVAILABLE: "Available",
  AWAY: "Away",
};

/** Titles that aren't part of a person's name. */
const HONORIFICS = new Set(["dr", "mr", "mrs", "ms", "miss", "mx", "prof", "professor"]);

/**
 * Initials for the photo-less fallback.
 *
 * Both ends of a clinician's name need trimming first: "Dr. Mia Chen-Ward"
 * was rendering as "DC" (the "Dr." counted as the first name), and anything
 * after a comma is a credential — "Dana Reyes, RDH" must not become "DR"
 * by way of the RDH.
 */
export function initials(name: string) {
  const withoutCredentials = name.split(",")[0].trim();
  const words = withoutCredentials.split(/\s+/).filter(Boolean);
  const named = words.filter((w) => !HONORIFICS.has(w.replace(/\./g, "").toLowerCase()));
  // A name that is nothing but a title still deserves a letter.
  const parts = named.length > 0 ? named : words;

  const first = parts[0]?.[0] ?? "";
  const last = parts.length > 1 ? parts[parts.length - 1][0] : "";
  return (first + last).toUpperCase();
}

/** Patient/provider avatar. Falls back to initials on a brand-gradient tile when no photo is available. */
export function Avatar({ name, src, size = "md", className, presence }: AvatarProps) {
  const face = src ? (
    <Image
        src={src}
        alt={name}
        width={sizePx[size]}
        height={sizePx[size]}
      className={cn(
        "rounded-full object-cover border border-border",
        sizeClasses[size],
        className,
      )}
    />
  ) : (
    <div
      role="img"
      aria-label={name}
      className={cn(
        "brand-gradient-bg flex items-center justify-center rounded-full font-semibold text-white",
        sizeClasses[size],
        className,
      )}
    >
      {initials(name)}
    </div>
  );

  if (!presence) return face;

  return (
    <span className="relative inline-flex shrink-0">
      {face}
      <span
        className={cn(
          // `ring` rather than `border`: the ring colour is the surface the
          // avatar sits on, so the dot reads as punched out of the photo.
          "absolute bottom-0 right-0 rounded-full ring-surface",
          dotClasses[size],
          presence === "AVAILABLE" ? "bg-[var(--color-success)]" : "bg-[var(--color-warning)]",
        )}
      />
      <span className="sr-only">{PRESENCE_LABEL[presence]}</span>
    </span>
  );
}
