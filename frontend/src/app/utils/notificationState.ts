import { notificationApi, NotificationResponse } from "../api/notificationApi";

export type NotificationCategory = "project" | "activity" | "system";
export type NotificationActionType = "proposal" | "document" | "message" | "none";

export type NotificationItem = {
  id: number;
  category: NotificationCategory;
  type: "announcement" | "like" | "complete" | "message" | "milestone";
  title: string;
  subtitle?: string;
  quote?: string;
  action?: string;
  actionSecondary?: string;
  time: string;
  badge?: boolean;
  avatar?: boolean;
  isRead: boolean;
  isSnoozed: boolean;
  actionType: NotificationActionType;
  senderProfileImage?: string;
  referenceId?: number;
};

// 백엔드의 Date를 파싱하여 n시간 전 등으로 변환하는 유틸
const timeAgo = (dateString: string) => {
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  
  if (diffInSeconds < 60) return "방금 전";
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}분 전`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}시간 전`;
  return `${Math.floor(diffInSeconds / 86400)}일 전`;
};

// 백엔드 NotificationType을 프론트엔드 포맷으로 변환
const mapBackendNotification = (item: NotificationResponse): NotificationItem => {
  let category: NotificationCategory = "system";
  let type: NotificationItem["type"] = "announcement";
  let actionType: NotificationActionType = "none";
  let action: string | undefined = undefined;

  switch (item.type) {
    case "LIKE":
      category = "activity";
      type = "like";
      break;
    case "FOLLOW":
      category = "activity";
      type = "like"; // 임시로 like 아이콘 사용 (하트 대신 다른 걸 쓸 수 있음)
      action = "프로필 보기";
      actionType = "none";
      break;
    case "PROJECT_APPLY":
      category = "project";
      type = "announcement";
      action = "제안 확인하기";
      actionType = "proposal";
      break;
    case "PROJECT_ACCEPT":
      category = "project";
      type = "complete";
      actionType = "document";
      break;
    case "MESSAGE":
      category = "activity";
      type = "message";
      action = "답글 달기";
      actionType = "message";
      break;
    case "COLLECTION":
      category = "activity";
      type = "like";
      break;
  }

  return {
    id: item.id,
    category,
    type,
    title: item.message,
    time: timeAgo(item.createdAt),
    isRead: item.isRead,
    isSnoozed: false,
    actionType,
    action,
    senderProfileImage: item.senderProfileImage,
    referenceId: item.referenceId,
    avatar: !!item.senderProfileImage,
  };
};

export const fetchNotifications = async (): Promise<NotificationItem[]> => {
  const response = await notificationApi.getNotifications(0, 50);
  if (response && response.content) {
    return response.content.map(mapBackendNotification);
  }
  return [];
};

export const fetchUnreadCount = async (): Promise<boolean> => {
  const response = await notificationApi.getUnreadCount();
  return response && response > 0 ? true : false;
};

export const markNotificationRead = async (notificationId: number) => {
  await notificationApi.markAsRead(notificationId);
};

export const markAllNotificationsRead = async () => {
  await notificationApi.markAllAsRead();
};
