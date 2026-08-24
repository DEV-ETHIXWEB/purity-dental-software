import Image from "next/image";
import { cn } from "@/lib/cn";

export interface AvatarProps {
  name: string;
  src?: string | null;
  size?: "sm" | "md" | "lg";
  className?: string;
}

const sizeClasses = {
  sm: "h-8 w-8 text-xs",
  md: "h-10 w-10 text-sm",
  lg: "h-14 w-14 text-base",
};

const sizePx = { sm: 32, md: 40, lg: 56 };

function initials(name: string) {
  const parts = name.trim().split(/\s+/);
  const first = parts[0]?.[0] ?? "";
  const last = parts.length > 1 ? parts[parts.length - 1][0] : "";
  return (first + last).toUpperCase();
}

/** Patient/provider avatar. Falls back to initials on a brand-gradient tile when no photo is available. */
export function Avatar({ name, src, size = "md", className }: AvatarProps) {
  if (src) {
    return (
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
    );
  }

  return (
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
}
