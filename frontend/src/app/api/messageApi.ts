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
  readAt: string | null;
};

export type MessageUserResponse = {
  userId: number;
  loginId: string;
  name: string | null;
  nickname: string;
  profileImage: string | null;
  role: "CLIENT" | "DESIGNER";
  job: string | null;
  introduction: string | null;
  url: string | null;
};

export type MessageProcessStatus = "completed" | "in-progress" | "pending";

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
  status: MessageProcessStatus;
  confirmations: MessageProcessConfirmationsResponse;
  tasks: MessageProcessTaskResponse[];
};

export type ConversationReviewResponse = {
  reviewId: number;
  projectId: number | null;
  projectTitle: string;
  reviewerId: number | null;
  reviewerName: string | null;
  reviewerNickname: string;
  reviewerProfileImage: string | null;
  rating: number;
  content: string;
  workCategories: string[];
  complimentTags: string[];
  createdAt: string | null;
};

export async function getMessageUsersApi() {
  return apiRequest<MessageUserResponse[]>(
    "/api/messages/users",
    {},
    "Failed to load message users.",
  );
}

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

export type MessageReadReceiptResponse = {
  conversationId: number;
  readerUserId: number;
  readerName: string;
  messageIds: number[];
  clientIds: string[];
  readAt: string;
};

export async function markConversationReadApi(conversationId: number) {
  return apiRequest<MessageReadReceiptResponse>(
    `/api/messages/conversations/${conversationId}/read`,
    {
      method: "POST",
    },
    "Failed to mark conversation as read.",
  );
}

export async function getConversationProcessesApi(conversationId: number) {
  return apiRequest<MessageProcessResponse[]>(
    `/api/messages/conversations/${conversationId}/processes`,
    {},
    "Failed to load message processes.",
  );
}

export async function saveConversationProcessesApi(
  conversationId: number,
  processes: MessageProcessResponse[],
) {
  return apiRequest<MessageProcessResponse[]>(
    `/api/messages/conversations/${conversationId}/processes`,
    {
      method: "PUT",
      body: JSON.stringify({ processes }),
    },
    "Failed to save message processes.",
  );
}

export async function updateConversationProcessTaskApi(
  conversationId: number,
  processId: number,
  taskId: number,
  completed: boolean,
) {
  return apiRequest<MessageProcessResponse>(
    `/api/messages/conversations/${conversationId}/processes/${processId}/tasks/${taskId}`,
    {
      method: "PATCH",
      body: JSON.stringify({ completed }),
    },
    "Failed to update message process task.",
  );
}

export async function updateConversationProcessConfirmationApi(
  conversationId: number,
  processId: number,
  role: "designer" | "client",
  confirmed: boolean,
) {
  return apiRequest<MessageProcessResponse>(
    `/api/messages/conversations/${conversationId}/processes/${processId}/confirmations/${role}`,
    {
      method: "PATCH",
      body: JSON.stringify({ confirmed }),
    },
    "Failed to update message process confirmation.",
  );
}

export async function createConversationReviewApi(
  conversationId: number,
  params: {
    projectTitle: string;
    rating: number;
    content: string;
    workCategories: string[];
    complimentTags: string[];
  },
) {
  return apiRequest<ConversationReviewResponse>(
    `/api/messages/conversations/${conversationId}/review`,
    {
      method: "POST",
      body: JSON.stringify(params),
    },
    "Failed to save conversation review.",
  );
}
