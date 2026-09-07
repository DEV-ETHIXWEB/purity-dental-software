import type { Metadata } from "next";
import { MessagesView } from "@/components/hygienist/MessagesView";
import { requireRole } from "@/lib/auth/authorize";
import { listConversations } from "@/lib/data/messaging";

export const metadata: Metadata = {
  title: "Messages",
  description: "Message patients directly and send overdue recall alerts.",
};

export default async function HygienistMessagesPage() {
  const session = await requireRole(["HYGIENIST", "ADMIN"]);
  const conversations = await listConversations(session.user.organizationId);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold text-text-primary">Messages</h1>
        <p className="text-sm text-text-secondary">
          {conversations.length} patient conversations.
        </p>
      </div>

      <MessagesView conversations={conversations} currentUserName={session.user.name} />
    </div>
  );
}
