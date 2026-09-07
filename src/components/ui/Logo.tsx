import Image from "next/image";
import { cn } from "@/lib/cn";

export interface LogoProps {
  className?: string;
  /** Pixel height of the rendered mark; width scales to the source aspect ratio. */
  height?: number;
}

// Source crops of the design team's exported asset (originally one PNG with
// the tooth icon stacked directly above the "Purity" wordmark). Squeezing
// that stacked image down to a single small `height` — as a sidebar nav
// mark needs — shrank the wordmark to the point of being illegible, so the
// two pieces are cropped into separate assets here and laid out
// horizontally instead, each sized off its own aspect ratio.
const MARK_ASPECT = 729 / 777;
const WORDMARK_ASPECT = 414 / 156;

/** Tooth icon + "Purity" wordmark, side by side. */
export function Logo({ className, height = 40 }: LogoProps) {
  const markHeight = height;
  const markWidth = Math.round(markHeight * MARK_ASPECT);
  const wordmarkHeight = Math.round(height * 0.6);
  const wordmarkWidth = Math.round(wordmarkHeight * WORDMARK_ASPECT);

  return (
    <span className={cn("inline-flex items-center gap-2", className)}>
      <Image
        src="/brand/purity-mark.png"
        alt=""
        width={markWidth}
        height={markHeight}
        priority
        className="h-auto object-contain"
      />
      <Image
        src="/brand/purity-wordmark.png"
        alt="Purity"
        width={wordmarkWidth}
        height={wordmarkHeight}
        priority
        className="h-auto object-contain"
      />
    </span>
  );
}
