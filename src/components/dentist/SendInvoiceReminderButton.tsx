"use client";

import { useState } from "react";
import { Send, Check, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { sendPatientMessage } from "@/lib/actions/send-message";
import { formatCentsAsCurrency, invoiceNumber } from "@/lib/billing-format";
import type { InvoiceWithDetails } from "@/lib/data/billing";

type SendState = "idle" | "sending" | "sent" | "error";

/**
 * Invoice detail page's "Send Reminder" — sends a real message on the
 * patient's conversation thread via `sendPatientMessage`. The invoice detail
 * pages are Server Components, so this interactive piece is split out
 * rather than making the whole page a Client Component.
 */
export function SendInvoiceReminderButton({ invoice }: { invoice: InvoiceWithDetails }) {
  const [status, setStatus] = useState<SendState>("idle");

  async function handleClick() {
    setStatus("sending");
    const result = await sendPatientMessage(
      invoice.patientId,
      `Hi ${invoice.patient.firstName}, this is a reminder that invoice ${invoiceNumber(invoice)} for ${formatCentsAsCurrency(invoice.totalCents)} is still due. Please reply here or call us if you have any questions.`,
    );
    setStatus(result.ok ? "sent" : "error");
  }

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleClick}
      disabled={status === "sending" || status === "sent"}
    >
      {status === "sending" ? (
        <Loader2 className="h-4 w-4 animate-spin motion-reduce:animate-none" aria-hidden="true" />
      ) : status === "sent" ? (
        <Check className="h-4 w-4" aria-hidden="true" />
      ) : (
        <Send className="h-4 w-4" aria-hidden="true" />
      )}
      {status === "sending"
        ? "Sending…"
        : status === "sent"
          ? "Reminder sent"
          : status === "error"
            ? "Try again"
            : "Send Reminder"}
    </Button>
  );
}
