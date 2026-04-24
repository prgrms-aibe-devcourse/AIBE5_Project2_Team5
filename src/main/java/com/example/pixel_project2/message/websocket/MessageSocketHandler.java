package com.example.pixel_project2.message.websocket;

import com.example.pixel_project2.config.jwt.AuthenticatedUser;
import com.example.pixel_project2.message.dto.ChatMessageResponse;
import com.example.pixel_project2.message.dto.MessageReadReceiptResponse;
import com.example.pixel_project2.message.dto.SendMessageRequest;
import com.example.pixel_project2.message.service.MessageService;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
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
    private static final String TYPE_CONVERSATION_READ = "conversation.read";
    private static final String TYPE_PRESENCE_SNAPSHOT = "presence.snapshot";
    private static final String TYPE_PRESENCE_UPDATE = "presence.update";
    private static final String TYPE_PING = "ping";
    private static final String TYPE_PONG = "pong";

    private final ObjectMapper objectMapper;
    private final MessageService messageService;
    private final ConcurrentHashMap<String, WebSocketSession> sessions = new ConcurrentHashMap<>();
    private final ConcurrentHashMap<String, Set<Long>> subscriptions = new ConcurrentHashMap<>();
    private final ConcurrentHashMap<String, Object> sessionLocks = new ConcurrentHashMap<>();
    private final ConcurrentHashMap<String, Long> sessionUsers = new ConcurrentHashMap<>();
    private final ConcurrentHashMap<Long, Set<String>> userSessions = new ConcurrentHashMap<>();

    @Override
    public void afterConnectionEstablished(WebSocketSession session) {
        sessions.put(session.getId(), session);
        subscriptions.put(session.getId(), Set.of());
        sessionLocks.put(session.getId(), new Object());

        AuthenticatedUser user = authenticatedUser(session);
        if (user == null) {
            return;
        }

        sessionUsers.put(session.getId(), user.id());
        Set<String> activeUserSessions = userSessions.computeIfAbsent(user.id(), ignored -> ConcurrentHashMap.newKeySet());
        boolean becameOnline = activeUserSessions.add(session.getId()) && activeUserSessions.size() == 1;
        if (becameOnline) {
            broadcastPresenceForUser(user.id(), true);
        }

        try {
            sendPresenceSnapshot(session, messageService.getConversationIdsForUser(user.id()));
        } catch (IOException ignored) {
            cleanupSession(session);
            closeQuietly(session);
        }
    }

    @Override
    protected void handleTextMessage(WebSocketSession session, TextMessage message) throws Exception {
        JsonNode payload = objectMapper.readTree(message.getPayload());
        String type = text(payload, "type");

        if (TYPE_SUBSCRIBE.equals(type)) {
            handleSubscribe(session, payload);
            return;
        }

        if (TYPE_PING.equals(type)) {
            handlePing(session);
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

        if (TYPE_CONVERSATION_READ.equals(type)) {
            handleConversationRead(session, payload);
            return;
        }

        sendError(session, "Unsupported socket message type.");
    }

    @Override
    public void afterConnectionClosed(WebSocketSession session, CloseStatus status) {
        cleanupSession(session);
    }

    @Override
    public void handleTransportError(WebSocketSession session, Throwable exception) throws Exception {
        cleanupSession(session);
        closeQuietly(session);
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
        sendPresenceSnapshot(session, conversationIds);
    }

    private void handlePing(WebSocketSession session) throws IOException {
        ObjectNode pong = objectMapper.createObjectNode();
        pong.put("type", TYPE_PONG);
        sendJson(session, pong);
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

        ChatMessageResponse savedMessage;
        try {
            savedMessage = messageService.sendMessage(
                    sender,
                    conversationId,
                    new SendMessageRequest(clientId, message, hasAttachments ? attachments : objectMapper.createArrayNode())
            );
        } catch (IllegalArgumentException e) {
            sendError(session, e.getMessage());
            return;
        }

        ObjectNode outbound = objectMapper.createObjectNode();
        outbound.put("type", TYPE_CHAT_MESSAGE);
        outbound.put("serverId", String.valueOf(savedMessage.id()));
        outbound.put("clientId", savedMessage.clientId() == null ? String.valueOf(savedMessage.id()) : savedMessage.clientId());
        outbound.put("conversationId", savedMessage.conversationId());
        outbound.put("senderUserId", savedMessage.senderUserId());
        outbound.put("senderName", savedMessage.senderName());
        outbound.put("message", savedMessage.message());
        outbound.put("createdAt", savedMessage.createdAt().toString());
        outbound.set("attachments", savedMessage.attachments());
        outbound.set("reactions", objectMapper.valueToTree(savedMessage.reactions()));
        outbound.put("readByPartner", savedMessage.readByPartner());

        broadcast(conversationId, session.getId(), messageService.getConversationParticipantIds(conversationId), outbound);
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
            sendError(session, "You do not have access to the conversation.");
            return;
        }

        ObjectNode outbound = objectMapper.createObjectNode();
        outbound.put("type", TYPE_TYPING);
        outbound.put("conversationId", conversationId);
        outbound.put("senderUserId", sender.id());
        outbound.put("isTyping", payload.path("isTyping").asBoolean(false));

        broadcast(conversationId, session.getId(), messageService.getConversationParticipantIds(conversationId), outbound);
    }

    private void handleConversationRead(WebSocketSession session, JsonNode payload) throws IOException {
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
        MessageReadReceiptResponse readReceipt;
        try {
            readReceipt = messageService.markConversationRead(sender, conversationId);
        } catch (IllegalArgumentException e) {
            sendError(session, e.getMessage());
            return;
        }

        ObjectNode outbound = objectMapper.createObjectNode();
        outbound.put("type", TYPE_CONVERSATION_READ);
        outbound.put("conversationId", readReceipt.conversationId());
        outbound.put("readerUserId", readReceipt.readerUserId());
        if (readReceipt.lastReadMessageId() == null) {
            outbound.putNull("lastReadMessageId");
        } else {
            outbound.put("lastReadMessageId", readReceipt.lastReadMessageId());
        }

        broadcast(conversationId, session.getId(), messageService.getConversationParticipantIds(conversationId), outbound);
    }

    private void broadcast(
            long conversationId,
            String senderSessionId,
            Set<Long> participantUserIds,
            ObjectNode outbound
    ) {
        for (WebSocketSession targetSession : sessions.values()) {
            if (!targetSession.isOpen()) {
                cleanupSession(targetSession);
                continue;
            }

            boolean senderSession = targetSession.getId().equals(senderSessionId);
            boolean subscribed = subscriptions
                    .getOrDefault(targetSession.getId(), Set.of())
                    .contains(conversationId);
            AuthenticatedUser targetUser = authenticatedUser(targetSession);
            boolean participantSession = targetUser != null
                    && participantUserIds.contains(targetUser.id());

            if (senderSession || subscribed || participantSession) {
                try {
                    sendJson(targetSession, outbound);
                } catch (IOException e) {
                    cleanupSession(targetSession);
                    closeQuietly(targetSession);
                }
            }
        }
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

    private void cleanupSession(WebSocketSession session) {
        sessions.remove(session.getId());
        subscriptions.remove(session.getId());
        sessionLocks.remove(session.getId());

        Long userId = sessionUsers.remove(session.getId());
        if (userId == null) {
            return;
        }

        Set<String> activeUserSessions = userSessions.get(userId);
        if (activeUserSessions == null) {
            return;
        }

        activeUserSessions.remove(session.getId());
        if (activeUserSessions.isEmpty()) {
            userSessions.remove(userId);
            broadcastPresenceForUser(userId, false);
        }
    }

    private void closeQuietly(WebSocketSession session) {
        try {
            if (session.isOpen()) {
                session.close();
            }
        } catch (IOException ignored) {
            // Best effort close for broken sockets.
        }
    }

    private String text(JsonNode payload, String fieldName) {
        JsonNode value = payload.path(fieldName);
        if (value.isMissingNode() || value.isNull()) {
            return null;
        }
        return value.asText();
    }

    private void sendPresenceSnapshot(WebSocketSession session, Set<Long> conversationIds) throws IOException {
        AuthenticatedUser currentUser = authenticatedUser(session);
        if (currentUser == null) {
            return;
        }

        ObjectNode payload = objectMapper.createObjectNode();
        payload.put("type", TYPE_PRESENCE_SNAPSHOT);
        var states = objectMapper.createArrayNode();

        for (Long conversationId : conversationIds) {
            Set<Long> participantIds = messageService.getConversationParticipantIds(conversationId);
            Long partnerUserId = participantIds.stream()
                    .filter(participantId -> !participantId.equals(currentUser.id()))
                    .findFirst()
                    .orElse(null);
            if (partnerUserId == null) {
                continue;
            }

            ObjectNode state = objectMapper.createObjectNode();
            state.put("conversationId", conversationId);
            state.put("userId", partnerUserId);
            state.put("isOnline", isUserOnline(partnerUserId));
            states.add(state);
        }

        payload.set("states", states);
        sendJson(session, payload);
    }

    private void broadcastPresenceForUser(Long userId, boolean isOnline) {
        Set<Long> conversationIds = messageService.getConversationIdsForUser(userId);
        for (Long conversationId : conversationIds) {
            ObjectNode outbound = objectMapper.createObjectNode();
            outbound.put("type", TYPE_PRESENCE_UPDATE);
            outbound.put("conversationId", conversationId);
            outbound.put("userId", userId);
            outbound.put("isOnline", isOnline);
            broadcast(conversationId, null, messageService.getConversationParticipantIds(conversationId), outbound);
        }
    }

    private boolean isUserOnline(Long userId) {
        Set<String> activeSessions = userSessions.get(userId);
        return activeSessions != null && !activeSessions.isEmpty();
    }
}
