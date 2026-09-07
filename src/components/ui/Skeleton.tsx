import { type HTMLAttributes } from "react";
import { cn } from "@/lib/cn";

/**
 * Base skeleton block — a shimmering placeholder matching the app's radius
 * scale. Compose these into page-shaped layouts in a route's `loading.tsx`
 * rather than showing a blank screen or a generic spinner while server data
 * loads.
 */
export function Skeleton({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      aria-hidden="true"
      className={cn("skeleton rounded-[var(--radius-md)]", className)}
      {...props}
    />
  );
}

/** Page header skeleton: title + subtitle line, matching every portal page's `<h1>`/description pattern. */
export function PageHeaderSkeleton() {
  return (
    <div className="flex flex-col gap-2">
      <Skeleton className="h-7 w-48" />
      <Skeleton className="h-4 w-72" />
    </div>
  );
}
