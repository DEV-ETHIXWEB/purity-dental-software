import Image from "next/image";
import { cn } from "@/lib/cn";

export interface LogoProps {
  className?: string;
  /** Pixel height of the rendered mark; width scales to the source aspect ratio. */
  height?: number;
}

/**
 * Purity wordmark + tooth icon, from the design team's exported asset.
 * Rendered as-is (not redrawn) per design guidance — the PNG already
 * combines the gradient tooth mark and two-tone "Purity" wordmark.
 */
export function Logo({ className, height = 40 }: LogoProps) {
  // Source asset is ~960x1000 (icon + wordmark stacked).
  const width = Math.round(height * 0.96);
  return (
    <Image
      src="/brand/purity-logo.png"
      alt="Purity"
      width={width}
      height={height}
      priority
      className={cn("h-auto object-contain", className)}
      style={{ height, width: "auto" }}
    />
  );
}
