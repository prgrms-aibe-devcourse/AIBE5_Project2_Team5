const UNREAD_NOTIFICATIONS_KEY = "pickxel:hasUnreadNotifications";
const UNREAD_MESSAGE_CONVERSATIONS_KEY = "pickxel:unreadMessageConversationIds";
const NOTIFICATION_STATE_CHANGE_EVENT = "pickxel:notification-state-change";
const DEFAULT_UNREAD_MESSAGE_CONVERSATION_IDS = [1];

const canUseStorage = () => typeof window !== "undefined";

const emitNotificationStateChange = () => {
  if (!canUseStorage()) return;
  window.dispatchEvent(new Event(NOTIFICATION_STATE_CHANGE_EVENT));
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

export const hasUnreadNotifications = () => {
  if (!canUseStorage()) return true;

  const storedValue = window.localStorage.getItem(UNREAD_NOTIFICATIONS_KEY);
  if (storedValue !== null) return storedValue === "true";

  return getUnreadMessageConversationIds().length > 0;
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

export const markAllNotificationsRead = () => {
  if (!canUseStorage()) return;

  window.localStorage.setItem(UNREAD_MESSAGE_CONVERSATIONS_KEY, "[]");
  window.localStorage.setItem(UNREAD_NOTIFICATIONS_KEY, "false");
  emitNotificationStateChange();
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
