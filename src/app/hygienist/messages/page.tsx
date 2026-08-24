import type { Metadata } from "next";
import { MessagesView } from "@/components/hygienist/MessagesView";
import { conversations } from "@/lib/sample-data";

export const metadata: Metadata = {
  title: "Messages",
  description: "Message patients directly and send overdue recall alerts.",
};

export default function HygienistMessagesPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold text-text-primary">Messages</h1>
        <p className="text-sm text-text-secondary">
          {conversations.length} patient conversations.
        </p>
      </div>

      <MessagesView conversations={conversations} />
    </div>
  );
}
