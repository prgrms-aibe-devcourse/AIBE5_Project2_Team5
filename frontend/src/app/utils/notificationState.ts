const UNREAD_NOTIFICATIONS_KEY = "pickxel:hasUnreadNotifications";
const UNREAD_MESSAGE_CONVERSATIONS_KEY = "pickxel:unreadMessageConversationIds";
const NOTIFICATION_ITEMS_KEY = "pickxel:notificationItems";
const NOTIFICATION_STATE_CHANGE_EVENT = "pickxel:notification-state-change";
const DEFAULT_UNREAD_MESSAGE_CONVERSATION_IDS = [1];

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
};

const DEFAULT_NOTIFICATIONS: NotificationItem[] = [
  {
    id: 1,
    category: "project",
    type: "announcement",
    title: "'Studio A'로부터 새로운 프로젝트 제안이 도착했습니다",
    subtitle: "브랜딩 아이덴티티 디자인 팀 신규 디자이너 합류 요청",
    action: "제안 확인하기",
    time: "방금 전",
    badge: true,
    isRead: false,
    isSnoozed: false,
    actionType: "proposal",
  },
  {
    id: 2,
    category: "activity",
    type: "like",
    title: "이민호 님 외 12명이 당신의 'Neo-Vintage Brand Concept'를 좋아합니다.",
    time: "2시간 전",
    avatar: true,
    isRead: false,
    isSnoozed: false,
    actionType: "none",
  },
  {
    id: 3,
    category: "system",
    type: "complete",
    title: "프로젝트 'AI 인터페이스 설계'의 서류 보완이 필요합니다",
    subtitle: "제출 전 체크리스트를 다시 확인하고 누락된 정보를 업로드해 주세요.",
    action: "서류 페이지 이동",
    time: "5시간 전",
    isRead: false,
    isSnoozed: false,
    actionType: "document",
  },
  {
    id: 4,
    category: "activity",
    type: "message",
    title: "김나영 님이 메시지를 남겼습니다",
    quote:
      "브랜딩 방향성이 인상적이었어요. 비슷한 톤으로 협업 가능한지 이야기 나눠보고 싶습니다.",
    action: "답글 달기",
    actionSecondary: "나중에 보기",
    time: "1일 전",
    isRead: false,
    isSnoozed: false,
    actionType: "message",
  },
  {
    id: 5,
    category: "system",
    type: "milestone",
    title: "축하합니다! 이번 '이달의 디자이너' 후보로 선정되었습니다",
    subtitle: "최근 30일간의 활동과 프로젝트 반응을 바탕으로 선정되었어요.",
    time: "2일 전",
    isRead: true,
    isSnoozed: false,
    actionType: "none",
  },
  {
    id: 6,
    category: "activity",
    type: "message",
    title: "정재현 님이 새 메시지를 보냈습니다",
    quote:
      "프로젝트 일정과 산출물 범위를 보고 제안드리고 싶었습니다. 빠르게 논의 가능하실까요?",
    action: "답글 달기",
    actionSecondary: "나중에 보기",
    time: "3시간 전",
    isRead: false,
    isSnoozed: false,
    actionType: "message",
  },
  {
    id: 7,
    category: "activity",
    type: "message",
    title: "박서준 님이 새 메시지를 보냈습니다",
    quote:
      "브랜드 리뉴얼 공고를 확인했습니다. 비슷한 레퍼런스 사례와 함께 제안드릴 수 있습니다.",
    action: "답글 달기",
    actionSecondary: "나중에 보기",
    time: "1시간 전",
    isRead: false,
    isSnoozed: false,
    actionType: "message",
  },
  {
    id: 8,
    category: "activity",
    type: "message",
    title: "이민호 님이 새 메시지를 보냈습니다",
    quote:
      "요구사항 문서를 보고 질문이 생겨 연락드렸습니다. 확인 가능하실 때 답변 부탁드립니다.",
    action: "답글 달기",
    actionSecondary: "나중에 보기",
    time: "방금 전",
    isRead: false,
    isSnoozed: false,
    actionType: "message",
  },
];

const canUseStorage = () => typeof window !== "undefined";

const emitNotificationStateChange = () => {
  if (!canUseStorage()) return;
  window.dispatchEvent(new Event(NOTIFICATION_STATE_CHANGE_EVENT));
};

const getDefaultNotifications = () => DEFAULT_NOTIFICATIONS.map((item) => ({ ...item }));

const normalizeNotificationCategory = (
  item: Pick<NotificationItem, "category" | "type" | "actionType" | "title">
): NotificationCategory => {
  if (item.actionType === "proposal" || item.actionType === "document") {
    return "project";
  }

  if (item.type === "like" || item.type === "message") {
    return "activity";
  }

  if (
    item.title.includes("시스템") ||
    item.title.includes("보안") ||
    item.title.includes("추천 디자이너") ||
    item.type === "milestone"
  ) {
    return "system";
  }

  return item.category;
};

const normalizeNotification = (item: NotificationItem): NotificationItem => ({
  ...item,
  category: normalizeNotificationCategory(item),
});

const persistNotifications = (notifications: NotificationItem[]) => {
  if (!canUseStorage()) return;

  const normalizedNotifications = notifications.map(normalizeNotification);

  window.localStorage.setItem(
    NOTIFICATION_ITEMS_KEY,
    JSON.stringify(normalizedNotifications)
  );
  window.localStorage.setItem(
    UNREAD_NOTIFICATIONS_KEY,
    String(normalizedNotifications.some((item) => !item.isRead && !item.isSnoozed))
  );
  emitNotificationStateChange();
};

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

export const getNotifications = () => {
  if (!canUseStorage()) return getDefaultNotifications();

  const storedItems = window.localStorage.getItem(NOTIFICATION_ITEMS_KEY);
  if (!storedItems) return getDefaultNotifications().map(normalizeNotification);

  try {
    const parsedItems = JSON.parse(storedItems);
    return Array.isArray(parsedItems)
      ? parsedItems
          .filter(
          (item): item is NotificationItem =>
            typeof item?.id === "number" &&
            typeof item?.category === "string" &&
            typeof item?.type === "string" &&
            typeof item?.title === "string" &&
            typeof item?.time === "string" &&
            typeof item?.isRead === "boolean" &&
            typeof item?.isSnoozed === "boolean" &&
            typeof item?.actionType === "string"
        )
          .map(normalizeNotification)
      : getDefaultNotifications().map(normalizeNotification);
  } catch {
    return getDefaultNotifications().map(normalizeNotification);
  }
};

export const hasUnreadNotifications = () => {
  if (!canUseStorage()) return true;

  const storedValue = window.localStorage.getItem(UNREAD_NOTIFICATIONS_KEY);
  if (storedValue !== null) return storedValue === "true";

  return getNotifications().some((item) => !item.isRead && !item.isSnoozed);
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
      String(getNotifications().some((item) => !item.isRead && !item.isSnoozed))
    );
    emitNotificationStateChange();
  }

  return remainingConversationIds;
};

export const markNotificationRead = (notificationId: number) => {
  const notifications = getNotifications().map((item) =>
    item.id === notificationId ? { ...item, isRead: true } : item
  );
  persistNotifications(notifications);
  return notifications;
};

export const snoozeNotification = (notificationId: number) => {
  const notifications = getNotifications().map((item) =>
    item.id === notificationId ? { ...item, isRead: true, isSnoozed: true } : item
  );
  persistNotifications(notifications);
  return notifications;
};

export const markAllNotificationsRead = () => {
  if (!canUseStorage()) return;

  const notifications = getNotifications().map((item) => ({ ...item, isRead: true }));
  window.localStorage.setItem(UNREAD_MESSAGE_CONVERSATIONS_KEY, "[]");
  persistNotifications(notifications);
};

export const subscribeNotificationState = (listener: () => void) => {
  if (!canUseStorage()) return () => {};

  const handleStorage = (event: StorageEvent) => {
    if (
      event.key === UNREAD_NOTIFICATIONS_KEY ||
      event.key === UNREAD_MESSAGE_CONVERSATIONS_KEY ||
      event.key === NOTIFICATION_ITEMS_KEY
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
