package com.example.pixel_project2.notification.websocket;

import com.example.pixel_project2.config.jwt.AuthenticatedUser;
import com.example.pixel_project2.message.websocket.MessageSocketHandshakeInterceptor;
import com.example.pixel_project2.notification.dto.NotificationResponseDto;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.CloseStatus;
import org.springframework.web.socket.TextMessage;
import org.springframework.web.socket.WebSocketSession;
import org.springframework.web.socket.handler.TextWebSocketHandler;

import java.io.IOException;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;

@Slf4j
@Component
@RequiredArgsConstructor
public class NotificationSocketHandler extends TextWebSocketHandler {
    private final ObjectMapper objectMapper;

    private final ConcurrentHashMap<String, WebSocketSession> sessions = new ConcurrentHashMap<>();
    private final ConcurrentHashMap<Long, Set<String>> sessionIdsByUserId = new ConcurrentHashMap<>();

    @Override
    public void afterConnectionEstablished(WebSocketSession session) {
        AuthenticatedUser user = authenticatedUser(session);
        if (user == null) {
            closeQuietly(session);
            return;
        }

        sessions.put(session.getId(), session);
        sessionIdsByUserId
                .computeIfAbsent(user.id(), ignored -> ConcurrentHashMap.newKeySet())
                .add(session.getId());
    }

    @Override
    public void afterConnectionClosed(WebSocketSession session, CloseStatus status) {
        cleanupSession(session);
    }

    @Override
    public void handleTransportError(WebSocketSession session, Throwable exception) {
        log.warn("notification socket transport error sessionId={}", session.getId(), exception);
        cleanupSession(session);
        closeQuietly(session);
    }

    public void broadcastNotification(Long receiverUserId, NotificationResponseDto notification, long unreadCount) {
        if (receiverUserId == null || notification == null) {
            return;
        }

        Set<String> targetSessionIds = sessionIdsByUserId.get(receiverUserId);
        if (targetSessionIds == null || targetSessionIds.isEmpty()) {
            return;
        }

        ObjectNode payload = objectMapper.createObjectNode();
        payload.put("type", "notification.created");
        payload.set("notification", objectMapper.valueToTree(notification));
        payload.put("unreadCount", unreadCount);

        for (String sessionId : targetSessionIds) {
            WebSocketSession session = sessions.get(sessionId);
            if (session == null || !session.isOpen()) {
                continue;
            }

            try {
                session.sendMessage(new TextMessage(objectMapper.writeValueAsString(payload)));
            } catch (IOException e) {
                log.warn("failed to push notification receiverUserId={} sessionId={}", receiverUserId, sessionId, e);
            }
        }
    }

    private AuthenticatedUser authenticatedUser(WebSocketSession session) {
        Object attribute = session.getAttributes().get(MessageSocketHandshakeInterceptor.AUTHENTICATED_USER_ATTRIBUTE);
        return attribute instanceof AuthenticatedUser authenticatedUser ? authenticatedUser : null;
    }

    private void cleanupSession(WebSocketSession session) {
        sessions.remove(session.getId());

        AuthenticatedUser user = authenticatedUser(session);
        if (user == null) {
            return;
        }

        sessionIdsByUserId.computeIfPresent(user.id(), (ignored, sessionIds) -> {
            sessionIds.remove(session.getId());
            return sessionIds.isEmpty() ? null : sessionIds;
        });
    }

    private void closeQuietly(WebSocketSession session) {
        try {
            if (session.isOpen()) {
                session.close();
            }
        } catch (IOException ignored) {
        }
    }
}
