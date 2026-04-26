import { notificationApi, NotificationResponse } from "../api/notificationApi";

export type NotificationCategory = "project" | "activity" | "system";
export type NotificationActionType = "proposal" | "document" | "message" | "feed" | "project" | "none";

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
  navigatePath?: string;
};

const UNREAD_NOTIFICATIONS_KEY = "pickxel:hasUnreadNotifications";
const UNREAD_MESSAGE_CONVERSATIONS_KEY = "pickxel:unreadMessageConversationIds";
const NOTIFICATION_STATE_CHANGE_EVENT = "pickxel:notification-state-change";
const DEFAULT_UNREAD_MESSAGE_CONVERSATION_IDS = [1];

const canUseStorage = () => typeof window !== "undefined";

const emitNotificationStateChange = () => {
  if (!canUseStorage()) return;
  window.dispatchEvent(new Event(NOTIFICATION_STATE_CHANGE_EVENT));
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

// type + senderNickname 기반으로 사람이 읽을 수 있는 알림 제목 생성
const buildNotificationTitle = (item: NotificationResponse): string => {
  const name = item.senderNickname || "누군가";
  switch (item.type) {
    case "LIKE":
      return `${name}님이 회원님의 게시물을 좋아합니다.`;
    case "FOLLOW":
      return `${name}님이 회원님을 팔로우하기 시작했습니다.`;
    case "PROJECT_APPLY":
      return `${name}님이 프로젝트에 지원했습니다.`;
    case "PROJECT_ACCEPT":
      return "프로젝트 지원이 수락되었습니다! 🎉";
    case "MESSAGE":
      return `${name}님에게서 새 메시지가 도착했습니다.`;
    case "COLLECTION":
      return `${name}님이 회원님의 게시물을 컬렉션에 저장했습니다.`;
    default:
      return "새 알림이 있습니다.";
  }
};

// type별 이동 경로 계산 (referenceId 활용)
const buildNavigatePath = (item: NotificationResponse): string | undefined => {
  switch (item.type) {
    case "LIKE":
    case "COLLECTION":
      // 피드 게시물로 이동 (해당 포스트 앵커)
      return item.referenceId ? `/feed` : "/feed";
    case "MESSAGE":
      return item.referenceId ? `/messages?conversationId=${item.referenceId}` : "/messages";
    case "PROJECT_APPLY":
    case "PROJECT_ACCEPT":
      return item.referenceId ? `/projects/${item.referenceId}` : "/projects";
    case "FOLLOW":
      return undefined; // 프로필 ID를 모르므로 탐색 페이지로 폴백
    default:
      return undefined;
  }
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
      action = "피드 보기";
      actionType = "feed";
      break;
    case "FOLLOW":
      category = "activity";
      type = "like";
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
      action = "프로젝트 보기";
      actionType = "project";
      break;
    case "MESSAGE":
      category = "activity";
      type = "message";
      action = "메시지 보기";
      actionType = "message";
      break;
    case "COLLECTION":
      category = "activity";
      type = "like";
      action = "피드 보기";
      actionType = "feed";
      break;
  }

  return {
    id: item.id,
    category,
    type,
    // type 기반 한국어 메시지 사용 (백엔드 암호화 문자열 무시)
    title: buildNotificationTitle(item),
    subtitle: item.senderNickname || undefined,
    time: timeAgo(item.createdAt),
    isRead: item.isRead,
    isSnoozed: false,
    actionType,
    action,
    senderProfileImage: item.senderProfileImage,
    referenceId: item.referenceId,
    avatar: !!item.senderProfileImage,
    navigatePath: buildNavigatePath(item),
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

// --- 아래 함수들은 기존 Messages.tsx 에서 의존하고 있는 함수들입니다 (하얀 화면 방지용) ---

export const getUnreadMessageConversationIds = () => {
  if (!canUseStorage()) return DEFAULT_UNREAD_MESSAGE_CONVERSATION_IDS;

  const storedIds = window.localStorage.getItem(UNREAD_MESSAGE_CONVERSATIONS_KEY);
  if (!storedIds) return DEFAULT_UNREAD_MESSAGE_CONVERSATION_IDS;

  try {
    const parsedIds = JSON.parse(storedIds);
    return Array.isArray(parsedIds)
      ? parsedIds.filter((id): id is number => typeof id === "number")
      : DEFAULT_UNREAD_MESSAGE_CONVERSATION_IDS;
  } catch {
    return DEFAULT_UNREAD_MESSAGE_CONVERSATION_IDS;
  }
};

export const markConversationRead = (conversationId: number) => {
  const remainingConversationIds = getUnreadMessageConversationIds().filter(
    (id) => id !== conversationId
  );

  if (canUseStorage()) {
    window.localStorage.setItem(
      UNREAD_MESSAGE_CONVERSATIONS_KEY,
      JSON.stringify(remainingConversationIds)
    );
    window.localStorage.setItem(
      UNREAD_NOTIFICATIONS_KEY,
      String(remainingConversationIds.length > 0)
    );
    emitNotificationStateChange();
  }

  return remainingConversationIds;
};

export const subscribeNotificationState = (listener: () => void) => {
  if (!canUseStorage()) return () => {};

  const handleStorage = (event: StorageEvent) => {
    if (
      event.key === UNREAD_NOTIFICATIONS_KEY ||
      event.key === UNREAD_MESSAGE_CONVERSATIONS_KEY
    ) {
      listener();
    }
  };

  window.addEventListener(NOTIFICATION_STATE_CHANGE_EVENT, listener);
  window.addEventListener("storage", handleStorage);

  return () => {
    window.removeEventListener(NOTIFICATION_STATE_CHANGE_EVENT, listener);
    window.removeEventListener("storage", handleStorage);
  };
};
