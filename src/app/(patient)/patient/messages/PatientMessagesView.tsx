"use client";

import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/Card";
import { PatientMessageThread } from "@/components/patient/PatientMessageThread";
import { sendPatientMessage } from "@/lib/actions/send-message";
import type { Message } from "@/generated/prisma/client";

export interface PatientMessagesViewProps {
  initialMessages: Message[];
  patientId: string;
  patientFirstName: string;
}

export function PatientMessagesView({ initialMessages, patientId, patientFirstName }: PatientMessagesViewProps) {
  const router = useRouter();

  async function handleSend(body: string) {
    const result = await sendPatientMessage(patientId, body);
    if (result.ok) router.refresh();
  }

  return (
    <Card className="overflow-hidden">
      <div className="h-[calc(100vh-14rem)] min-h-[420px]">
        <PatientMessageThread messages={initialMessages} patientFirstName={patientFirstName} onSend={handleSend} />
      </div>
    </Card>
  );
}
