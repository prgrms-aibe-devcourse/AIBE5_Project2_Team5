package com.example.pixel_project2.message.websocket;

import org.springframework.stereotype.Component;

import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;

@Component
public class MessagePresenceTracker {
    private static final long TYPING_TTL_MILLIS = 3_000L;

    private final ConcurrentHashMap<Long, Set<String>> userSessions = new ConcurrentHashMap<>();
    private final ConcurrentHashMap<String, Long> typingExpirations = new ConcurrentHashMap<>();

    public boolean connectUser(Long userId, String sessionId) {
        Set<String> activeSessions = userSessions.computeIfAbsent(userId, ignored -> ConcurrentHashMap.newKeySet());
        boolean added = activeSessions.add(sessionId);
        return added && activeSessions.size() == 1;
    }

    public boolean disconnectUser(Long userId, String sessionId) {
        clearTypingForUser(userId);

        Set<String> activeSessions = userSessions.get(userId);
        if (activeSessions == null) {
            return false;
        }

        activeSessions.remove(sessionId);
        if (!activeSessions.isEmpty()) {
            return false;
        }

        userSessions.remove(userId);
        return true;
    }

    public boolean isUserOnline(Long userId) {
        Set<String> activeSessions = userSessions.get(userId);
        return activeSessions != null && !activeSessions.isEmpty();
    }

    public void updateTyping(Long conversationId, Long userId, boolean isTyping) {
        String key = typingKey(conversationId, userId);
        if (!isTyping) {
            typingExpirations.remove(key);
            return;
        }

        typingExpirations.put(key, System.currentTimeMillis() + TYPING_TTL_MILLIS);
    }

    public boolean isTyping(Long conversationId, Long userId) {
        String key = typingKey(conversationId, userId);
        Long expiration = typingExpirations.get(key);
        if (expiration == null) {
            return false;
        }

        if (expiration < System.currentTimeMillis()) {
            typingExpirations.remove(key, expiration);
            return false;
        }

        return true;
    }

    private void clearTypingForUser(Long userId) {
        String suffix = ":" + userId;
        typingExpirations.keySet().removeIf((key) -> key.endsWith(suffix));
    }

    private String typingKey(Long conversationId, Long userId) {
        return conversationId + ":" + userId;
    }
}
