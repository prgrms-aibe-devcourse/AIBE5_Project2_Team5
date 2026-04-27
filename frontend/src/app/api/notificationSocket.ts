import { getAccessToken } from "../utils/auth";
import type { NotificationResponse } from "./notificationApi";

export type IncomingNotificationCreatedSocketEvent = {
  type: "notification.created";
  notification: NotificationResponse;
  unreadCount: number;
};

export type IncomingNotificationSocketEvent = IncomingNotificationCreatedSocketEvent;

type NotificationSocketCallbacks = {
  onEvent: (event: IncomingNotificationSocketEvent) => void;
  onOpen?: (context: { reconnected: boolean }) => void;
  onClose?: () => void;
  onError?: (message: string) => void;
};

const NOTIFICATION_SOCKET_PATH = "/ws/notifications";
const RECONNECT_BASE_DELAY = 1000;
const RECONNECT_MAX_DELAY = 5000;

const getWebSocketOrigin = () => {
  const configuredOrigin = import.meta.env.VITE_WS_ORIGIN ?? import.meta.env.VITE_API_ORIGIN;
  const origin = configuredOrigin || "http://localhost:8080";
  return origin.replace(/^http/i, "ws");
};

const buildNotificationSocketUrl = () => {
  const token = getAccessToken();
  if (!token) {
    return "";
  }

  return `${getWebSocketOrigin()}${NOTIFICATION_SOCKET_PATH}?token=${encodeURIComponent(token)}`;
};

export function createNotificationSocket(callbacks: NotificationSocketCallbacks) {
  let socket: WebSocket | null = null;
  let reconnectTimerId: number | null = null;
  let reconnectAttempt = 0;
  let manuallyClosed = false;

  const clearReconnectTimer = () => {
    if (reconnectTimerId === null) return;
    window.clearTimeout(reconnectTimerId);
    reconnectTimerId = null;
  };

  const scheduleReconnect = () => {
    if (manuallyClosed || reconnectTimerId !== null) {
      return;
    }

    const delay = Math.min(RECONNECT_BASE_DELAY * 2 ** reconnectAttempt, RECONNECT_MAX_DELAY);
    reconnectAttempt += 1;

    reconnectTimerId = window.setTimeout(() => {
      reconnectTimerId = null;
      connect();
    }, delay);
  };

  const connect = () => {
    const url = buildNotificationSocketUrl();
    if (!url || socket) {
      return;
    }

    manuallyClosed = false;
    socket = new WebSocket(url);

    socket.onopen = () => {
      const wasReconnected = reconnectAttempt > 0;
      clearReconnectTimer();
      reconnectAttempt = 0;
      callbacks.onOpen?.({ reconnected: wasReconnected });
    };

    socket.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data) as IncomingNotificationSocketEvent;
        if (payload?.type === "notification.created") {
          callbacks.onEvent(payload);
        }
      } catch {
        callbacks.onError?.("알림 소켓 메시지를 처리하지 못했어요.");
      }
    };

    socket.onerror = () => {
      callbacks.onError?.("알림 소켓 연결에 문제가 발생했어요.");
    };

    socket.onclose = () => {
      socket = null;
      callbacks.onClose?.();
      scheduleReconnect();
    };
  };

  const close = () => {
    manuallyClosed = true;
    clearReconnectTimer();
    socket?.close();
    socket = null;
  };

  return {
    connect,
    close,
    isOpen: () => socket?.readyState === WebSocket.OPEN,
  };
}
