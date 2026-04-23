import { getAccessToken } from "../utils/auth";

export type MessageSocketAttachment = unknown;

export type OutgoingChatSocketMessage = {
  clientId: string;
  conversationId: number;
  message: string;
  attachments?: MessageSocketAttachment[];
  createdAt?: string;
};

export type IncomingChatSocketMessage = {
  type: "chat.message";
  serverId: string;
  clientId: string;
  conversationId: number;
  senderUserId: number;
  senderName: string;
  message: string;
  attachments: MessageSocketAttachment[];
  createdAt: string;
};

type MessageSocketCallbacks = {
  onMessage: (message: IncomingChatSocketMessage) => void;
  onOpen?: () => void;
  onClose?: () => void;
  onError?: (message: string) => void;
};

type PendingAck = {
  resolve: (value: { serverId: string }) => void;
  reject: () => void;
  timeoutId: number;
};

const MESSAGE_SOCKET_PATH = "/ws/messages";
const MESSAGE_SOCKET_ACK_TIMEOUT = 5000;

const getWebSocketOrigin = () => {
  const configuredOrigin = import.meta.env.VITE_WS_ORIGIN ?? import.meta.env.VITE_API_ORIGIN;
  const currentOrigin =
    typeof window === "undefined" ? "http://localhost:8080" : window.location.origin;
  const origin = configuredOrigin || currentOrigin;
  return origin.replace(/^http/i, "ws");
};

const buildMessageSocketUrl = () => {
  const token = getAccessToken();
  if (!token) {
    return "";
  }

  return `${getWebSocketOrigin()}${MESSAGE_SOCKET_PATH}?token=${encodeURIComponent(token)}`;
};

export function createMessageSocket(callbacks: MessageSocketCallbacks) {
  let socket: WebSocket | null = null;
  const pendingAcks = new Map<string, PendingAck>();

  const rejectPendingAcks = () => {
    pendingAcks.forEach((pendingAck) => {
      window.clearTimeout(pendingAck.timeoutId);
      pendingAck.reject();
    });
    pendingAcks.clear();
  };

  const sendJson = (payload: unknown) => {
    if (!socket || socket.readyState !== WebSocket.OPEN) {
      throw new Error("Message socket is not connected.");
    }

    socket.send(JSON.stringify(payload));
  };

  const connect = () => {
    const url = buildMessageSocketUrl();
    if (!url || socket) {
      return;
    }

    socket = new WebSocket(url);

    socket.onopen = () => {
      callbacks.onOpen?.();
    };

    socket.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data);
        if (payload?.type === "chat.message") {
          const incomingMessage = payload as IncomingChatSocketMessage;
          const pendingAck = pendingAcks.get(incomingMessage.clientId);
          if (pendingAck) {
            window.clearTimeout(pendingAck.timeoutId);
            pendingAck.resolve({ serverId: incomingMessage.serverId });
            pendingAcks.delete(incomingMessage.clientId);
          }
          callbacks.onMessage(incomingMessage);
          return;
        }

        if (payload?.type === "error") {
          callbacks.onError?.(payload.message ?? "Message socket error.");
        }
      } catch {
        callbacks.onError?.("Message socket payload could not be parsed.");
      }
    };

    socket.onerror = () => {
      callbacks.onError?.("Message socket connection failed.");
    };

    socket.onclose = () => {
      socket = null;
      rejectPendingAcks();
      callbacks.onClose?.();
    };
  };

  const close = () => {
    const currentSocket = socket;
    socket = null;
    rejectPendingAcks();
    currentSocket?.close();
  };

  const subscribe = (conversationIds: number[]) => {
    sendJson({
      type: "subscribe",
      conversationIds,
    });
  };

  const sendMessage = (message: OutgoingChatSocketMessage) =>
    new Promise<{ serverId: string }>((resolve, reject) => {
      const timeoutId = window.setTimeout(() => {
        pendingAcks.delete(message.clientId);
        reject();
      }, MESSAGE_SOCKET_ACK_TIMEOUT);

      pendingAcks.set(message.clientId, {
        resolve,
        reject,
        timeoutId,
      });

      try {
        sendJson({
          type: "chat.message",
          ...message,
        });
      } catch (error) {
        window.clearTimeout(timeoutId);
        pendingAcks.delete(message.clientId);
        reject(error);
      }
    });

  const isOpen = () => socket?.readyState === WebSocket.OPEN;

  return {
    close,
    connect,
    isOpen,
    sendMessage,
    subscribe,
  };
}
