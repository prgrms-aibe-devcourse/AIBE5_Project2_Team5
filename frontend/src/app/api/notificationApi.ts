import { apiRequest } from "./apiClient";

export type NotificationResponse = {
  id: number;
  type:
    | "LIKE"
    | "FOLLOW"
    | "PROJECT_APPLY"
    | "PROJECT_ACCEPT"
    | "MESSAGE"
    | "COLLECTION"
    | "COMMENT";
  message: string | null;
  referenceId: number | null;
  isRead: boolean;
  createdAt: string;
  senderNickname: string | null;
  senderProfileImage: string | null;
};

export type NotificationPageResponse = {
  content: NotificationResponse[];
  totalPages: number;
  totalElements: number;
  size: number;
  number: number;
  first: boolean;
  last: boolean;
  empty: boolean;
};

export const notificationApi = {
  getNotifications(page = 0, size = 20) {
    const searchParams = new URLSearchParams({
      page: String(page),
      size: String(size),
    });

    return apiRequest<NotificationPageResponse>(
      `/api/notifications?${searchParams.toString()}`,
      {
        cache: "no-store",
      },
      "Failed to load notifications."
    );
  },

  getUnreadCount() {
    return apiRequest<number>(
      "/api/notifications/unread-count",
      {
        cache: "no-store",
      },
      "Failed to load unread notification count."
    );
  },

  markAsRead(notificationId: number) {
    return apiRequest<void>(
      `/api/notifications/${notificationId}/read`,
      {
        method: "PUT",
      },
      "Failed to mark notification as read."
    );
  },

  markAllAsRead() {
    return apiRequest<void>(
      "/api/notifications/read-all",
      {
        method: "PUT",
      },
      "Failed to mark all notifications as read."
    );
  },
};
