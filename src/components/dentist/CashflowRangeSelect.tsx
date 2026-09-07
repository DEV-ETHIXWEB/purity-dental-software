"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { cn } from "@/lib/cn";

export type CashflowRange = "thisYear" | "last12Months";

/** Drives the Cashflow Trend chart's period via a `?range=` searchParam, matching TopBar's search-redirect pattern (router.push, no client-side data fetch of its own). */
export function CashflowRangeSelect({ value, className }: { value: CashflowRange; className?: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();

  function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const params = new URLSearchParams(searchParams);
    params.set("range", e.target.value);
    router.push(`?${params.toString()}`);
  }

  return (
    <select
      value={value}
      onChange={handleChange}
      aria-label="Cashflow trend period"
      className={cn(
        "h-8 rounded-[var(--radius-md)] border border-border bg-surface px-2.5 text-sm text-text-primary",
        "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-brand-blue)]",
        className,
      )}
    >
      <option value="thisYear">This Year</option>
      <option value="last12Months">Last 12 Months</option>
    </select>
  );
}
