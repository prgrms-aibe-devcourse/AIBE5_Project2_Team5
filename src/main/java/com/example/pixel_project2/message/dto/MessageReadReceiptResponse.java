package com.example.pixel_project2.message.dto;

import java.time.LocalDateTime;
import java.util.List;

public record MessageReadReceiptResponse(
        Long conversationId,
        Long readerUserId,
        String readerName,
        List<Long> messageIds,
        List<String> clientIds,
        LocalDateTime readAt
) {
}
