import { apiRequest } from "./apiClient";
import type { MessageSocketAttachment } from "./messageSocket";

export type MessageConversationResponse = {
  id: number;
  partnerUserId: number;
  partnerLoginId: string;
  partnerName: string | null;
  partnerNickname: string;
  partnerProfileImage: string | null;
  partnerRole: "CLIENT" | "DESIGNER";
  partnerJob: string | null;
  partnerIntroduction: string | null;
  partnerUrl: string | null;
  lastMessage: string | null;
  lastMessageAt: string | null;
  unreadCount: number;
};

export type ChatMessageResponse = {
  id: number;
  clientId: string | null;
  conversationId: number;
  senderUserId: number;
  senderName: string;
  message: string;
  attachments: MessageSocketAttachment[];
  createdAt: string;
};

export async function getMessageConversationsApi() {
  return apiRequest<MessageConversationResponse[]>(
    "/api/messages/conversations",
    {},
    "Failed to load conversations.",
  );
}

export async function createMessageConversationApi(partnerUserId: number) {
  return apiRequest<MessageConversationResponse>(
    "/api/messages/conversations",
    {
      method: "POST",
      body: JSON.stringify({ partnerUserId }),
    },
    "Failed to create conversation.",
  );
}

export async function getConversationMessagesApi(conversationId: number) {
  return apiRequest<ChatMessageResponse[]>(
    `/api/messages/conversations/${conversationId}/messages`,
    {},
    "Failed to load messages.",
  );
}

export async function sendConversationMessageApi(
  conversationId: number,
  params: {
    clientId: string;
    message: string;
    attachments?: MessageSocketAttachment[];
  },
) {
  return apiRequest<ChatMessageResponse>(
    `/api/messages/conversations/${conversationId}/messages`,
    {
      method: "POST",
      body: JSON.stringify({
        clientId: params.clientId,
        message: params.message,
        attachments: params.attachments ?? [],
      }),
    },
    "Failed to send message.",
  );
}
