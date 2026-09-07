import "server-only";
import { prisma } from "@/lib/prisma";
import type { Conversation, Message, MessageSender, Patient } from "@/generated/prisma/client";

/** Real Prisma-backed messaging queries, backing the Hygienist/Patient "Communication tab". */

export type ConversationWithUnread = Conversation & {
  unreadCount: number;
  patient: Patient;
  messages: Message[];
};

/**
 * All conversations in the org, each with an unread count (messages from the
 * PATIENT side sent after the most recent PROVIDER reply — approximates
 * "unread by staff" without a separate read-receipt table).
 */
export async function listConversations(organizationId: string): Promise<ConversationWithUnread[]> {
  const conversations = await prisma.conversation.findMany({
    where: { organizationId },
    include: { messages: { orderBy: { sentAt: "asc" } }, patient: true },
    orderBy: { updatedAt: "desc" },
  });

  return conversations.map((c) => {
    let lastProviderAt = new Date(0);
    for (const m of c.messages) {
      if (m.sender === "PROVIDER" && m.sentAt > lastProviderAt) lastProviderAt = m.sentAt;
    }
    const unreadCount = c.messages.filter((m) => m.sender === "PATIENT" && m.sentAt > lastProviderAt).length;
    return { ...c, unreadCount };
  });
}

export async function messagesForConversation(
  organizationId: string,
  conversationId: string,
): Promise<Message[]> {
  return prisma.message.findMany({
    where: { conversationId, conversation: { organizationId } },
    orderBy: { sentAt: "asc" },
  });
}

export async function conversationForPatient(
  organizationId: string,
  patientId: string,
): Promise<Conversation | null> {
  return prisma.conversation.findFirst({ where: { patientId, organizationId } });
}

/**
 * Whether a patient has unread PROVIDER messages — approximated the same way
 * as the staff-side `listConversations().unreadCount` (messages from the
 * other side sent after this side's most recent message), just mirrored.
 */
export async function hasUnreadForPatient(organizationId: string, patientId: string): Promise<boolean> {
  const conversation = await conversationForPatient(organizationId, patientId);
  if (!conversation) return false;
  const messages = await messagesForConversation(organizationId, conversation.id);

  let lastPatientAt = new Date(0);
  for (const m of messages) {
    if (m.sender === "PATIENT" && m.sentAt > lastPatientAt) lastPatientAt = m.sentAt;
  }
  return messages.some((m) => m.sender === "PROVIDER" && m.sentAt > lastPatientAt);
}

/** Append a message, creating the conversation on first contact if one doesn't exist yet. */
export async function sendMessage(params: {
  organizationId: string;
  patientId: string;
  sender: MessageSender;
  senderUserId?: string;
  body: string;
}): Promise<Message> {
  const conversation = await prisma.conversation.upsert({
    where: { patientId: params.patientId },
    update: {},
    create: { organizationId: params.organizationId, patientId: params.patientId },
  });

  return prisma.message.create({
    data: {
      conversationId: conversation.id,
      sender: params.sender,
      senderUserId: params.senderUserId,
      body: params.body,
    },
  });
}
