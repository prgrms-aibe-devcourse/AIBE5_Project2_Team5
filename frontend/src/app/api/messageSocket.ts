import { getAccessToken } from "../utils/auth";
import type {
  MessageProcessResponse,
  MessageReactionSummaryResponse,
} from "./messageApi";

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
  reactions: MessageReactionSummaryResponse[];
  readByPartner: boolean;
};

export type IncomingTypingSocketMessage = {
  type: "typing";
  conversationId: number;
  senderUserId: number;
  isTyping: boolean;
};

export type IncomingConversationReadSocketMessage = {
  type: "conversation.read";
  conversationId: number;
  readerUserId: number;
  lastReadMessageId: number | null;
};

export type IncomingReactionUpdateSocketMessage = {
  type: "reaction.update";
  conversationId: number;
  messageId: number;
  reactions: MessageReactionSummaryResponse[];
};

export type IncomingProcessUpdateSocketMessage = {
  type: "process.update";
  conversationId: number;
  processes: MessageProcessResponse[];
};

export type MessagePresenceState = {
  conversationId: number;
  userId: number;
  isOnline: boolean;
};

export type IncomingPresenceSnapshotSocketMessage = {
  type: "presence.snapshot";
  states: MessagePresenceState[];
};

export type IncomingPresenceUpdateSocketMessage = {
  type: "presence.update";
  conversationId: number;
  userId: number;
  isOnline: boolean;
};

export type IncomingMessageSocketEvent =
  | IncomingChatSocketMessage
  | IncomingTypingSocketMessage
  | IncomingConversationReadSocketMessage
  | IncomingReactionUpdateSocketMessage
  | IncomingProcessUpdateSocketMessage
  | IncomingPresenceSnapshotSocketMessage
  | IncomingPresenceUpdateSocketMessage;

type MessageSocketCallbacks = {
  onEvent: (event: IncomingMessageSocketEvent) => void;
  onOpen?: (context: { reconnected: boolean }) => void;
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
const MESSAGE_SOCKET_RECONNECT_BASE_DELAY = 1000;
const MESSAGE_SOCKET_RECONNECT_MAX_DELAY = 5000;
const MESSAGE_SOCKET_HEARTBEAT_INTERVAL = 15000;
const MESSAGE_SOCKET_HEARTBEAT_TIMEOUT = 10000;
const DEBUG_MESSAGE_SOCKET = import.meta.env.DEV;

const debugMessageSocket = (...args: unknown[]) => {
  if (DEBUG_MESSAGE_SOCKET) {
    console.debug("[MessageSocket]", ...args);
  }
};

const getWebSocketOrigin = () => {
  const configuredOrigin = import.meta.env.VITE_WS_ORIGIN ?? import.meta.env.VITE_API_ORIGIN;
  const origin = configuredOrigin || "http://localhost:8080";
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
  let reconnectTimerId: number | null = null;
  let heartbeatIntervalId: number | null = null;
  let heartbeatTimeoutId: number | null = null;
  let reconnectAttempt = 0;
  let manuallyClosed = false;
  const pendingAcks = new Map<string, PendingAck>();

  const rejectPendingAcks = () => {
    pendingAcks.forEach((pendingAck) => {
      window.clearTimeout(pendingAck.timeoutId);
      pendingAck.reject();
    });
    pendingAcks.clear();
  };

  const clearReconnectTimer = () => {
    if (reconnectTimerId === null) return;
    window.clearTimeout(reconnectTimerId);
    reconnectTimerId = null;
  };

  const clearHeartbeatTimeout = () => {
    if (heartbeatTimeoutId === null) return;
    window.clearTimeout(heartbeatTimeoutId);
    heartbeatTimeoutId = null;
  };

  const clearHeartbeatInterval = () => {
    if (heartbeatIntervalId === null) return;
    window.clearInterval(heartbeatIntervalId);
    heartbeatIntervalId = null;
  };

  const clearHeartbeat = () => {
    clearHeartbeatTimeout();
    clearHeartbeatInterval();
  };

  const scheduleReconnect = () => {
    if (manuallyClosed || reconnectTimerId !== null) {
      return;
    }

    const delay = Math.min(
      MESSAGE_SOCKET_RECONNECT_BASE_DELAY * 2 ** reconnectAttempt,
      MESSAGE_SOCKET_RECONNECT_MAX_DELAY,
    );
    reconnectAttempt += 1;

    reconnectTimerId = window.setTimeout(() => {
      reconnectTimerId = null;
      connect();
    }, delay);
  };

  const sendJson = (payload: unknown) => {
    if (!socket || socket.readyState !== WebSocket.OPEN) {
      throw new Error("Message socket is not connected.");
    }

    socket.send(JSON.stringify(payload));
  };

  const startHeartbeat = () => {
    clearHeartbeat();

    heartbeatIntervalId = window.setInterval(() => {
      if (!socket || socket.readyState !== WebSocket.OPEN) {
        return;
      }

      clearHeartbeatTimeout();

      try {
        sendJson({
          type: "ping",
          sentAt: new Date().toISOString(),
        });
      } catch {
        socket.close();
        return;
      }

      heartbeatTimeoutId = window.setTimeout(() => {
        if (socket && socket.readyState === WebSocket.OPEN) {
          socket.close();
        }
      }, MESSAGE_SOCKET_HEARTBEAT_TIMEOUT);
    }, MESSAGE_SOCKET_HEARTBEAT_INTERVAL);
  };

  const connect = () => {
    const url = buildMessageSocketUrl();
    if (!url || socket) {
      return;
    }

    manuallyClosed = false;
    socket = new WebSocket(url);

    socket.onopen = () => {
      const wasReconnected = reconnectAttempt > 0;
      clearReconnectTimer();
      clearHeartbeatTimeout();
      reconnectAttempt = 0;
      startHeartbeat();
      callbacks.onOpen?.({ reconnected: wasReconnected });
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
          callbacks.onEvent(incomingMessage);
          return;
        }

        if (payload?.type === "typing") {
          debugMessageSocket("received typing", payload);
          callbacks.onEvent(payload as IncomingTypingSocketMessage);
          return;
        }

        if (payload?.type === "conversation.read") {
          callbacks.onEvent(payload as IncomingConversationReadSocketMessage);
          return;
        }

        if (payload?.type === "reaction.update") {
          callbacks.onEvent(payload as IncomingReactionUpdateSocketMessage);
          return;
        }

        if (payload?.type === "process.update") {
          callbacks.onEvent(payload as IncomingProcessUpdateSocketMessage);
          return;
        }

        if (payload?.type === "presence.snapshot") {
          debugMessageSocket("received presence.snapshot", payload);
          callbacks.onEvent(payload as IncomingPresenceSnapshotSocketMessage);
          return;
        }

        if (payload?.type === "presence.update") {
          debugMessageSocket("received presence.update", payload);
          callbacks.onEvent(payload as IncomingPresenceUpdateSocketMessage);
          return;
        }

        if (payload?.type === "pong") {
          clearHeartbeatTimeout();
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
      clearHeartbeat();
      rejectPendingAcks();
      callbacks.onClose?.();
      scheduleReconnect();
    };
  };

  const close = () => {
    manuallyClosed = true;
    clearReconnectTimer();
    clearHeartbeat();
    reconnectAttempt = 0;
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

  const sendTyping = (conversationId: number, isTyping: boolean) => {
    debugMessageSocket("send typing", { conversationId, isTyping });
    sendJson({
      type: "typing",
      conversationId,
      isTyping,
    });
  };

  const markConversationRead = (conversationId: number) => {
    sendJson({
      type: "conversation.read",
      conversationId,
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
    markConversationRead,
    sendMessage,
    sendTyping,
    subscribe,
  };
}
