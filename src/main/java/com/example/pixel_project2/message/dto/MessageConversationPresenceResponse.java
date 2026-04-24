package com.example.pixel_project2.message.dto;

public record MessageConversationPresenceResponse(
        Long conversationId,
        Long partnerUserId,
        boolean partnerAvailable,
        boolean partnerTyping
) {
}
