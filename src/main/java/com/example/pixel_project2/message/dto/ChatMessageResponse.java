package com.example.pixel_project2.message.dto;

import com.fasterxml.jackson.databind.JsonNode;

import java.time.LocalDateTime;

public record ChatMessageResponse(
        Long id,
        String clientId,
        Long conversationId,
        Long senderUserId,
        String senderName,
        String message,
        JsonNode attachments,
        LocalDateTime createdAt,
        LocalDateTime readAt
) {
}
