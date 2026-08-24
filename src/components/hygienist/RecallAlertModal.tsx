"use client";

import { useState } from "react";
import { BellRing, CheckCircle2 } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";

export interface RecallAlertModalProps {
  open: boolean;
  onClose: () => void;
  patientName: string;
  /** Called once the simulated send completes, so callers can update their own state (e.g. mark "sent"). */
  onSent?: () => void;
}

/**
 * Confirms and "sends" a recall/follow-up alert to an overdue patient.
 * PLACEHOLDER: no real notification pipeline (SMS/email/push) exists yet —
 * this simulates a brief send delay with a real button-loading state, then
 * shows a confirmation. No message is actually delivered anywhere.
 */
export function RecallAlertModal({ open, onClose, patientName, onSent }: RecallAlertModalProps) {
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  function handleSend() {
    setSending(true);
    window.setTimeout(() => {
      setSending(false);
      setSent(true);
      onSent?.();
    }, 700);
  }

  function handleClose() {
    onClose();
    // Reset after the close animation-less unmount so the next open starts fresh.
    window.setTimeout(() => setSent(false), 0);
  }

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title="Send Recall Alert"
      description={
        sent
          ? undefined
          : `Send a follow-up reminder to ${patientName} about their overdue recall visit.`
      }
      footer={
        sent ? (
          <Button onClick={handleClose}>Done</Button>
        ) : (
          <>
            <Button variant="outline" onClick={handleClose} disabled={sending}>
              Cancel
            </Button>
            <Button onClick={handleSend} disabled={sending}>
              {sending ? "Sending…" : "Send Alert"}
            </Button>
          </>
        )
      }
    >
      {sent ? (
        <div className="flex flex-col items-center gap-3 py-4 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-success-bg text-success-text">
            <CheckCircle2 className="h-6 w-6" aria-hidden="true" />
          </div>
          <p className="text-sm font-medium text-text-primary">
            Recall alert sent to {patientName}.
          </p>
        </div>
      ) : (
        <div className="flex items-start gap-3 rounded-[var(--radius-md)] bg-surface-muted p-3 text-sm text-text-secondary">
          <BellRing className="h-4 w-4 shrink-0 text-text-secondary" aria-hidden="true" />
          <p>
            The patient will receive a reminder via their preferred contact method to schedule
            their overdue recall cleaning.
          </p>
        </div>
      )}
    </Modal>
  );
}
