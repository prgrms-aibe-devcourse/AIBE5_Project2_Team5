import { apiRequest } from "./apiClient";

export interface NotificationResponse {
  id: number;
  type: "LIKE" | "FOLLOW" | "PROJECT_APPLY" | "PROJECT_ACCEPT" | "MESSAGE" | "COLLECTION";
  message: string;
  referenceId: number;
  isRead: boolean;
  createdAt: string;
  senderNickname?: string;
  senderProfileImage?: string;
}

export interface PaginatedResponse<T> {
  content: T[];
  pageable: any;
  last: boolean;
  totalPages: number;
  totalElements: number;
  first: boolean;
  size: number;
  number: number;
  sort: any;
  numberOfElements: number;
  empty: boolean;
}

export const notificationApi = {
  getNotifications: async (page = 0, size = 20) => {
    return apiRequest<PaginatedResponse<NotificationResponse>>(`/api/notifications?page=${page}&size=${size}`);
  },

  getUnreadCount: async () => {
    return apiRequest<number>(`/api/notifications/unread-count`);
  },

  markAsRead: async (notificationId: number) => {
    return apiRequest<void>(`/api/notifications/${notificationId}/read`, {
      method: "PUT",
    });
  },

  markAllAsRead: async () => {
    return apiRequest<void>(`/api/notifications/read-all`, {
      method: "PUT",
    });
  },
};
