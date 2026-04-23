import { getAccessToken } from "../utils/auth";

export type MessageSocketAttachment = unknown;

export type MessageSocketReaction = {
  emoji: string;
  count: number;
  reactedByMe?: boolean;
};

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
  reactions: MessageSocketReaction[];
  createdAt: string;
  readAt: string | null;
};

export type IncomingTypingSocketMessage = {
  type: "typing";
  conversationId: number;
  senderUserId: number;
  senderName: string;
  isTyping: boolean;
};

export type IncomingReactionSocketMessage = {
  type: "message.reaction";
  conversationId: number;
  messageClientId: string;
  emoji: string;
  action: "add" | "remove";
  senderUserId: number;
  senderName: string;
};

export type IncomingReadReceiptSocketMessage = {
  type: "message.read";
  conversationId: number;
  readerUserId: number;
  readerName: string;
  messageIds: number[];
  clientIds: string[];
  readAt: string;
};

export type IncomingProcessSocketMessage = {
  type: "process.updated";
  conversationId: number;
  updaterUserId?: number;
  processes: Array<{
    id: number;
    title: string;
    status: "completed" | "in-progress" | "pending";
    confirmations: {
      designer: boolean;
      client: boolean;
    };
    tasks: Array<{
      id: number;
      text: string;
      completed: boolean;
    }>;
  }>;
};

type MessageSocketCallbacks = {
  onMessage: (message: IncomingChatSocketMessage) => void;
  onTyping?: (message: IncomingTypingSocketMessage) => void;
  onReaction?: (message: IncomingReactionSocketMessage) => void;
  onReadReceipt?: (message: IncomingReadReceiptSocketMessage) => void;
  onProcessUpdate?: (message: IncomingProcessSocketMessage) => void;
  onOpen?: () => void;
  onClose?: () => void;
  onError?: (message: string) => void;
};

type PendingAck = {
  resolve: (value: { serverId: string; createdAt: string; readAt: string | null }) => void;
  reject: () => void;
  timeoutId: number;
};

const MESSAGE_SOCKET_PATH = "/ws/messages";
const MESSAGE_SOCKET_ACK_TIMEOUT = 5000;
const MAX_QUEUED_REACTIONS = 50;

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
  let reconnectTimerId: number | null = null;
  let shouldReconnect = true;
  const pendingAcks = new Map<string, PendingAck>();
  const latestTypingStates = new Map<number, boolean>();
  const queuedReactions: Array<{
    conversationId: number;
    messageClientId: string;
    emoji: string;
    action: "add" | "remove";
  }> = [];

  const clearReconnectTimer = () => {
    if (reconnectTimerId === null) {
      return;
    }

    window.clearTimeout(reconnectTimerId);
    reconnectTimerId = null;
  };

  const scheduleReconnect = () => {
    if (!shouldReconnect || reconnectTimerId !== null) {
      return;
    }

    reconnectTimerId = window.setTimeout(() => {
      reconnectTimerId = null;
      connect();
    }, 1200);
  };

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

  const isOpen = () => socket?.readyState === WebSocket.OPEN;

  const flushQueuedControlMessages = () => {
    latestTypingStates.forEach((isTyping, conversationId) => {
      if (!isTyping) return;
      sendJson({
        type: "typing",
        conversationId,
        isTyping: true,
      });
    });

    while (queuedReactions.length > 0) {
      sendJson({
        type: "message.reaction",
        ...queuedReactions.shift(),
      });
    }
  };

  const connect = () => {
    shouldReconnect = true;
    clearReconnectTimer();

    const url = buildMessageSocketUrl();
    if (!url || socket) {
      return;
    }

    socket = new WebSocket(url);

    socket.onopen = () => {
      callbacks.onOpen?.();
      flushQueuedControlMessages();
    };

    socket.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data);
        if (payload?.type === "chat.message") {
          const incomingMessage = payload as IncomingChatSocketMessage;
          const pendingAck = pendingAcks.get(incomingMessage.clientId);
          if (pendingAck) {
            window.clearTimeout(pendingAck.timeoutId);
            pendingAck.resolve({
              serverId: incomingMessage.serverId,
              createdAt: incomingMessage.createdAt,
              readAt: incomingMessage.readAt ?? null,
            });
            pendingAcks.delete(incomingMessage.clientId);
          }
          callbacks.onMessage(incomingMessage);
          return;
        }

        if (payload?.type === "typing") {
          callbacks.onTyping?.(payload as IncomingTypingSocketMessage);
          return;
        }

        if (payload?.type === "message.reaction") {
          callbacks.onReaction?.(payload as IncomingReactionSocketMessage);
          return;
        }

        if (payload?.type === "message.read") {
          callbacks.onReadReceipt?.(payload as IncomingReadReceiptSocketMessage);
          return;
        }

        if (payload?.type === "process.updated") {
          callbacks.onProcessUpdate?.(payload as IncomingProcessSocketMessage);
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
      scheduleReconnect();
    };
  };

  const close = () => {
    shouldReconnect = false;
    clearReconnectTimer();
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
    if (isTyping) {
      latestTypingStates.set(conversationId, true);
    } else {
      latestTypingStates.delete(conversationId);
    }

    if (!isOpen()) {
      connect();
      return;
    }

    sendJson({
      type: "typing",
      conversationId,
      isTyping,
    });
  };

  const sendReaction = (message: {
    conversationId: number;
    messageClientId: string;
    emoji: string;
    action: "add" | "remove";
  }) => {
    if (!isOpen()) {
      queuedReactions.push(message);
      if (queuedReactions.length > MAX_QUEUED_REACTIONS) {
        queuedReactions.shift();
      }
      connect();
      return;
    }

    sendJson({
      type: "message.reaction",
      ...message,
    });
  };

  const sendRead = (conversationId: number) => {
    if (!isOpen()) {
      connect();
      return false;
    }

    sendJson({
      type: "message.read",
      conversationId,
    });
    return true;
  };

  const sendMessage = (message: OutgoingChatSocketMessage) =>
    new Promise<{ serverId: string; createdAt: string; readAt: string | null }>((resolve, reject) => {
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

  return {
    close,
    connect,
    isOpen,
    sendReaction,
    sendRead,
    sendMessage,
    sendTyping,
    subscribe,
  };
}
