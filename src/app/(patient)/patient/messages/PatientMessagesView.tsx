"use client";

import { useState } from "react";
import { Card } from "@/components/ui/Card";
import { PatientMessageThread } from "@/components/patient/PatientMessageThread";
import { type SampleMessage } from "@/lib/sample-data";

export function PatientMessagesView({ initialMessages }: { initialMessages: SampleMessage[] }) {
  const [messages, setMessages] = useState(initialMessages);

  function handleSend(body: string) {
    const newMessage: SampleMessage = {
      id: `msg_patient_local_${Date.now()}`,
      conversationId: initialMessages[0]?.conversationId ?? "conv_sarah_johnson",
      sender: "PATIENT",
      body,
      sentAt: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, newMessage]);
  }

  return (
    <Card className="overflow-hidden">
      <div className="h-[calc(100vh-14rem)] min-h-[420px]">
        <PatientMessageThread messages={messages} onSend={handleSend} />
      </div>
    </Card>
  );
}
