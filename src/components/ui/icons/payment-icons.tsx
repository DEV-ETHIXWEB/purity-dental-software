import { Banknote } from "lucide-react";
import { cn } from "@/lib/cn";
import type { InvoicePaymentMethod } from "@/generated/prisma/client";

/**
 * Generic, non-trademarked payment-method chips (colored rounded-rect +
 * short label) — deliberately not pixel-accurate reproductions of the real
 * Visa/Mastercard/CareCredit network marks shown in the Figma reference,
 * to avoid reproducing trademarked logos.
 */
const METHOD_STYLES: Record<Exclude<InvoicePaymentMethod, "CASH">, { label: string; className: string }> = {
  VISA: { label: "VISA", className: "bg-[#1a1f71] text-white" },
  MASTERCARD: { label: "MC", className: "bg-[#eb001b] text-white" },
  CARECREDIT: { label: "CareCredit", className: "bg-[#0073cf] text-white" },
  HSA: { label: "HSA", className: "bg-[var(--color-brand-teal-text)] text-white" },
};

export function PaymentMethodChip({
  method,
  last4,
  className,
}: {
  method: InvoicePaymentMethod | null;
  last4?: string | null;
  className?: string;
}) {
  if (!method) {
    return <span className={cn("text-xs text-text-secondary", className)}>—</span>;
  }

  if (method === "CASH") {
    return (
      <span className={cn("inline-flex items-center gap-1.5 text-xs text-text-secondary", className)}>
        <Banknote className="h-3.5 w-3.5" aria-hidden="true" />
        Cash
      </span>
    );
  }

  const style = METHOD_STYLES[method];
  return (
    <span className={cn("inline-flex items-center gap-1.5 text-xs text-text-secondary", className)}>
      <span className={cn("rounded px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide", style.className)}>
        {style.label}
      </span>
      {last4 && <span>•••• {last4}</span>}
    </span>
  );
}
