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
  partnerAvailable: boolean;
  partnerTyping: boolean;
};

export type MessageConversationPresenceResponse = {
  conversationId: number;
  partnerUserId: number;
  partnerAvailable: boolean;
  partnerTyping: boolean;
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
  reactions: MessageReactionSummaryResponse[];
  readByPartner: boolean;
};

export type MessageReactionSummaryResponse = {
  emoji: string;
  count: number;
  reactedByMe: boolean;
};

export type MessageReactionUpdateResponse = {
  messageId: number;
  reactions: MessageReactionSummaryResponse[];
};

export type MessageProcessTaskResponse = {
  id: number;
  text: string;
  completed: boolean;
};

export type MessageProcessConfirmationsResponse = {
  designer: boolean;
  client: boolean;
};

export type MessageProcessResponse = {
  id: number;
  title: string;
  status: "completed" | "in-progress" | "pending";
  tasks: MessageProcessTaskResponse[];
  confirmations: MessageProcessConfirmationsResponse;
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

export async function getConversationPresenceApi(conversationId: number) {
  return apiRequest<MessageConversationPresenceResponse>(
    `/api/messages/conversations/${conversationId}/presence`,
    {},
    "Failed to load conversation presence.",
  );
}

export async function markConversationReadApi(conversationId: number) {
  return apiRequest<{
    conversationId: number;
    readerUserId: number;
    lastReadMessageId: number | null;
  }>(
    `/api/messages/conversations/${conversationId}/read`,
    {
      method: "POST",
    },
    "Failed to mark conversation as read.",
  );
}

export async function toggleMessageReactionApi(
  conversationId: number,
  messageId: number,
  emoji: string,
) {
  return apiRequest<MessageReactionUpdateResponse>(
    `/api/messages/conversations/${conversationId}/messages/${messageId}/reactions/toggle`,
    {
      method: "POST",
      body: JSON.stringify({ emoji }),
    },
    "Failed to update reaction.",
  );
}

export async function getConversationProcessesApi(conversationId: number) {
  return apiRequest<MessageProcessResponse[]>(
    `/api/messages/conversations/${conversationId}/processes`,
    {},
    "Failed to load processes.",
  );
}

export async function saveConversationProcessesApi(
  conversationId: number,
  processes: Array<{
    id?: number;
    title: string;
    confirmations: MessageProcessConfirmationsResponse;
    tasks: Array<{
      id?: number;
      text: string;
      completed: boolean;
    }>;
  }>,
) {
  return apiRequest<MessageProcessResponse[]>(
    `/api/messages/conversations/${conversationId}/processes`,
    {
      method: "PUT",
      body: JSON.stringify({ processes }),
    },
    "Failed to save processes.",
  );
}

export async function deleteMessageConversationApi(conversationId: number) {
  return apiRequest<null>(
    `/api/messages/conversations/${conversationId}`,
    {
      method: "DELETE",
    },
    "Failed to delete conversation.",
  );
}
