package com.example.pixel_project2.message.websocket;

import com.example.pixel_project2.config.jwt.AuthenticatedUser;
import com.example.pixel_project2.message.dto.ChatMessageResponse;
import com.example.pixel_project2.message.dto.MessageReadReceiptResponse;
import com.example.pixel_project2.message.dto.SendMessageRequest;
import com.example.pixel_project2.message.event.ChatMessageSentEvent;
import com.example.pixel_project2.message.event.MessageReadReceiptEvent;
import com.example.pixel_project2.message.event.MessageProcessesUpdatedEvent;
import com.example.pixel_project2.message.service.MessageService;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;
import org.springframework.web.socket.CloseStatus;
import org.springframework.web.socket.TextMessage;
import org.springframework.web.socket.WebSocketSession;
import org.springframework.web.socket.handler.TextWebSocketHandler;

import java.io.IOException;
import java.util.List;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;

@Component
@RequiredArgsConstructor
public class MessageSocketHandler extends TextWebSocketHandler {
    private static final String TYPE_SUBSCRIBE = "subscribe";
    private static final String TYPE_CHAT_MESSAGE = "chat.message";
    private static final String TYPE_TYPING = "typing";
    private static final String TYPE_MESSAGE_REACTION = "message.reaction";
    private static final String TYPE_MESSAGE_READ = "message.read";
    private static final String TYPE_PROCESS_UPDATED = "process.updated";

    private final ObjectMapper objectMapper;
    private final MessageService messageService;
    private final ConcurrentHashMap<String, WebSocketSession> sessions = new ConcurrentHashMap<>();
    private final ConcurrentHashMap<String, Set<Long>> subscriptions = new ConcurrentHashMap<>();
    private final ConcurrentHashMap<String, Object> sessionLocks = new ConcurrentHashMap<>();

    @Override
    public void afterConnectionEstablished(WebSocketSession session) {
        sessions.put(session.getId(), session);
        subscriptions.put(session.getId(), Set.of());
        sessionLocks.put(session.getId(), new Object());
    }

    @Override
    protected void handleTextMessage(WebSocketSession session, TextMessage message) throws Exception {
        JsonNode payload = objectMapper.readTree(message.getPayload());
        String type = text(payload, "type");

        if (TYPE_SUBSCRIBE.equals(type)) {
            handleSubscribe(session, payload);
            return;
        }

        if (TYPE_CHAT_MESSAGE.equals(type)) {
            handleChatMessage(session, payload);
            return;
        }

        if (TYPE_TYPING.equals(type)) {
            handleTyping(session, payload);
            return;
        }

        if (TYPE_MESSAGE_REACTION.equals(type)) {
            handleReaction(session, payload);
            return;
        }

        if (TYPE_MESSAGE_READ.equals(type)) {
            handleMessageRead(session, payload);
            return;
        }

        sendError(session, "Unsupported socket message type.");
    }

    @Override
    public void afterConnectionClosed(WebSocketSession session, CloseStatus status) {
        removeSession(session);
    }

    private void handleSubscribe(WebSocketSession session, JsonNode payload) throws IOException {
        JsonNode conversationIdsNode = payload.path("conversationIds");
        if (!conversationIdsNode.isArray()) {
            sendError(session, "conversationIds must be an array.");
            return;
        }

        Set<Long> conversationIds = ConcurrentHashMap.newKeySet();
        conversationIdsNode.forEach((conversationIdNode) -> {
            if (conversationIdNode.canConvertToLong()) {
                conversationIds.add(conversationIdNode.asLong());
            }
        });

        subscriptions.put(session.getId(), Set.copyOf(conversationIds));

        ObjectNode response = objectMapper.createObjectNode();
        response.put("type", "subscribed");
        response.set("conversationIds", objectMapper.valueToTree(List.copyOf(conversationIds)));
        sendJson(session, response);
    }

    private void handleChatMessage(WebSocketSession session, JsonNode payload) throws IOException {
        AuthenticatedUser sender = authenticatedUser(session);
        if (sender == null) {
            sendError(session, "Authentication is required.");
            return;
        }

        if (!payload.path("conversationId").canConvertToLong()) {
            sendError(session, "conversationId is required.");
            return;
        }

        long conversationId = payload.path("conversationId").asLong();
        String clientId = text(payload, "clientId");
        String message = text(payload, "message");
        JsonNode attachments = payload.path("attachments");
        boolean hasAttachments = attachments.isArray() && !attachments.isEmpty();

        if ((message == null || message.isBlank()) && !hasAttachments) {
            sendError(session, "Message content or attachment is required.");
            return;
        }

        try {
            messageService.sendMessage(
                    sender,
                    conversationId,
                    new SendMessageRequest(clientId, message, hasAttachments ? attachments : objectMapper.createArrayNode())
            );
        } catch (IllegalArgumentException e) {
            sendError(session, e.getMessage());
            return;
        }
    }

    private void handleTyping(WebSocketSession session, JsonNode payload) throws IOException {
        AuthenticatedUser sender = authenticatedUser(session);
        if (sender == null) {
            sendError(session, "Authentication is required.");
            return;
        }

        if (!payload.path("conversationId").canConvertToLong()) {
            sendError(session, "conversationId is required.");
            return;
        }

        long conversationId = payload.path("conversationId").asLong();
        if (!messageService.canAccessConversation(sender, conversationId)) {
            sendError(session, "Conversation access is denied.");
            return;
        }

        ObjectNode outbound = objectMapper.createObjectNode();
        outbound.put("type", TYPE_TYPING);
        outbound.put("conversationId", conversationId);
        outbound.put("senderUserId", sender.id());
        outbound.put("senderName", sender.nickname());
        outbound.put("isTyping", payload.path("isTyping").asBoolean(false));
        broadcast(conversationId, outbound, session.getId());
    }

    private void handleReaction(WebSocketSession session, JsonNode payload) throws IOException {
        AuthenticatedUser sender = authenticatedUser(session);
        if (sender == null) {
            sendError(session, "Authentication is required.");
            return;
        }

        if (!payload.path("conversationId").canConvertToLong()) {
            sendError(session, "conversationId is required.");
            return;
        }

        long conversationId = payload.path("conversationId").asLong();
        if (!messageService.canAccessConversation(sender, conversationId)) {
            sendError(session, "Conversation access is denied.");
            return;
        }

        String messageClientId = text(payload, "messageClientId");
        String emoji = text(payload, "emoji");
        String action = text(payload, "action");
        if (messageClientId == null || messageClientId.isBlank()
                || emoji == null || emoji.isBlank()
                || (!"add".equals(action) && !"remove".equals(action))) {
            sendError(session, "Reaction payload is invalid.");
            return;
        }

        ObjectNode outbound = objectMapper.createObjectNode();
        outbound.put("type", TYPE_MESSAGE_REACTION);
        outbound.put("conversationId", conversationId);
        outbound.put("messageClientId", messageClientId);
        outbound.put("emoji", emoji);
        outbound.put("action", action);
        outbound.put("senderUserId", sender.id());
        outbound.put("senderName", sender.nickname());
        broadcast(conversationId, outbound, session.getId());
    }

    private void handleMessageRead(WebSocketSession session, JsonNode payload) throws IOException {
        AuthenticatedUser reader = authenticatedUser(session);
        if (reader == null) {
            sendError(session, "Authentication is required.");
            return;
        }

        if (!payload.path("conversationId").canConvertToLong()) {
            sendError(session, "conversationId is required.");
            return;
        }

        long conversationId = payload.path("conversationId").asLong();
        try {
            messageService.markConversationRead(reader, conversationId);
        } catch (IllegalArgumentException e) {
            sendError(session, e.getMessage());
        }
    }

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void handleChatMessageSent(ChatMessageSentEvent event) {
        ChatMessageResponse savedMessage = event.message();
        ObjectNode outbound = toOutboundMessage(savedMessage);
        broadcast(savedMessage.conversationId(), outbound, null);
    }

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void handleMessageReadReceipt(MessageReadReceiptEvent event) {
        MessageReadReceiptResponse receipt = event.receipt();
        ObjectNode outbound = objectMapper.createObjectNode();
        outbound.put("type", TYPE_MESSAGE_READ);
        outbound.put("conversationId", receipt.conversationId());
        outbound.put("readerUserId", receipt.readerUserId());
        outbound.put("readerName", receipt.readerName());
        outbound.put("readAt", receipt.readAt().toString());
        outbound.set("messageIds", objectMapper.valueToTree(receipt.messageIds()));
        outbound.set("clientIds", objectMapper.valueToTree(receipt.clientIds()));
        broadcast(receipt.conversationId(), outbound, null);
    }

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void handleMessageProcessesUpdated(MessageProcessesUpdatedEvent event) {
        ObjectNode outbound = objectMapper.createObjectNode();
        outbound.put("type", TYPE_PROCESS_UPDATED);
        outbound.put("conversationId", event.conversationId());
        outbound.set("processes", objectMapper.valueToTree(event.processes()));
        broadcast(event.conversationId(), outbound, null);
    }

    private ObjectNode toOutboundMessage(ChatMessageResponse savedMessage) {
        ObjectNode outbound = objectMapper.createObjectNode();
        outbound.put("type", TYPE_CHAT_MESSAGE);
        outbound.put("serverId", String.valueOf(savedMessage.id()));
        outbound.put("clientId", savedMessage.clientId() == null ? String.valueOf(savedMessage.id()) : savedMessage.clientId());
        outbound.put("conversationId", savedMessage.conversationId());
        outbound.put("senderUserId", savedMessage.senderUserId());
        outbound.put("senderName", savedMessage.senderName());
        outbound.put("message", savedMessage.message());
        outbound.put("createdAt", savedMessage.createdAt().toString());
        if (savedMessage.readAt() == null) {
            outbound.putNull("readAt");
        } else {
            outbound.put("readAt", savedMessage.readAt().toString());
        }
        outbound.set("attachments", savedMessage.attachments());
        return outbound;
    }

    private void broadcast(long conversationId, ObjectNode outbound, String excludedSessionId) {
        for (WebSocketSession targetSession : sessions.values()) {
            if (!targetSession.isOpen()) {
                removeSession(targetSession);
                continue;
            }
            if (targetSession.getId().equals(excludedSessionId)) {
                continue;
            }

            boolean subscribed = subscriptions
                    .getOrDefault(targetSession.getId(), Set.of())
                    .contains(conversationId);
            AuthenticatedUser targetUser = authenticatedUser(targetSession);
            boolean participantSession = targetUser != null
                    && messageService.canAccessConversation(targetUser, conversationId);

            if (subscribed || participantSession) {
                try {
                    sendJson(targetSession, outbound);
                } catch (IOException e) {
                    removeSession(targetSession);
                    try {
                        targetSession.close(CloseStatus.SERVER_ERROR);
                    } catch (IOException ignored) {
                    }
                }
            }
        }
    }

    private void removeSession(WebSocketSession session) {
        sessions.remove(session.getId());
        subscriptions.remove(session.getId());
        sessionLocks.remove(session.getId());
    }

    private AuthenticatedUser authenticatedUser(WebSocketSession session) {
        Object user = session.getAttributes().get(MessageSocketHandshakeInterceptor.AUTHENTICATED_USER_ATTRIBUTE);
        return user instanceof AuthenticatedUser authenticatedUser ? authenticatedUser : null;
    }

    private void sendError(WebSocketSession session, String message) throws IOException {
        ObjectNode error = objectMapper.createObjectNode();
        error.put("type", "error");
        error.put("message", message);
        sendJson(session, error);
    }

    private void sendJson(WebSocketSession session, JsonNode payload) throws IOException {
        Object lock = sessionLocks.computeIfAbsent(session.getId(), ignored -> new Object());
        synchronized (lock) {
            if (session.isOpen()) {
                session.sendMessage(new TextMessage(objectMapper.writeValueAsString(payload)));
            }
        }
    }

    private String text(JsonNode payload, String fieldName) {
        JsonNode value = payload.path(fieldName);
        if (value.isMissingNode() || value.isNull()) {
            return null;
        }
        return value.asText();
    }
}
