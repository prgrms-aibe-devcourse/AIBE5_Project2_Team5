package com.example.pixel_project2.message.dto;

public record MessageReadReceiptResponse(
        Long conversationId,
        Long readerUserId,
        Long lastReadMessageId
) {
}
