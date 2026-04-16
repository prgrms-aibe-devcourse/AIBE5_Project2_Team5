const NOTIFICATION_UNREAD_COUNT_KEY = "notification-unread-count";
const NOTIFICATION_BADGE_EVENT = "notification-badge-updated";
const NOTIFICATION_READ_IDS_KEY = "notification-read-ids";

export const DEFAULT_NOTIFICATION_UNREAD_COUNT = 5;

export function getStoredNotificationUnreadCount() {
  if (typeof window === "undefined") {
    return DEFAULT_NOTIFICATION_UNREAD_COUNT;
  }

  const rawValue = window.localStorage.getItem(NOTIFICATION_UNREAD_COUNT_KEY);
  const parsedValue = rawValue ? Number(rawValue) : Number.NaN;

  return Number.isFinite(parsedValue) ? parsedValue : DEFAULT_NOTIFICATION_UNREAD_COUNT;
}

export function setStoredNotificationUnreadCount(count: number) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(NOTIFICATION_UNREAD_COUNT_KEY, String(Math.max(0, count)));
  window.dispatchEvent(new Event(NOTIFICATION_BADGE_EVENT));
}

export function hydrateNotificationReadState<T extends { id: number; isRead: boolean }>(
  notifications: T[],
) {
  if (typeof window === "undefined") {
    return notifications;
  }

  const rawValue = window.localStorage.getItem(NOTIFICATION_READ_IDS_KEY);

  if (!rawValue) {
    return notifications;
  }

  try {
    const readIds = new Set<number>(JSON.parse(rawValue));

    return notifications.map((notification) => ({
      ...notification,
      isRead: readIds.has(notification.id) ? true : notification.isRead,
    }));
  } catch {
    return notifications;
  }
}

export function syncStoredNotifications<T extends { id: number; isRead: boolean }>(notifications: T[]) {
  if (typeof window === "undefined") {
    return;
  }

  const readIds = notifications.filter((notification) => notification.isRead).map((notification) => notification.id);
  const unreadCount = notifications.filter((notification) => !notification.isRead).length;

  window.localStorage.setItem(NOTIFICATION_READ_IDS_KEY, JSON.stringify(readIds));
  setStoredNotificationUnreadCount(unreadCount);
}

export function subscribeToNotificationBadge(callback: () => void) {
  if (typeof window === "undefined") {
    return () => undefined;
  }

  const handleStorage = (event: StorageEvent) => {
    if (event.key === NOTIFICATION_UNREAD_COUNT_KEY) {
      callback();
    }
  };

  window.addEventListener("storage", handleStorage);
  window.addEventListener(NOTIFICATION_BADGE_EVENT, callback);

  return () => {
    window.removeEventListener("storage", handleStorage);
    window.removeEventListener(NOTIFICATION_BADGE_EVENT, callback);
  };
}
