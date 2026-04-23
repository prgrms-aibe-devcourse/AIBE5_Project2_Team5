package com.example.pixel_project2.message.dto;

public record MessageReactionEventResponse(
        Long conversationId,
        String messageClientId,
        String emoji,
        String action,
        Long senderUserId,
        String senderName
) {
}
