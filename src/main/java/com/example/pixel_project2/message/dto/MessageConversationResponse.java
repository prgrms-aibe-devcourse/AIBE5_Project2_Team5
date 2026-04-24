package com.example.pixel_project2.message.dto;

import com.example.pixel_project2.common.entity.enums.UserRole;

import java.time.LocalDateTime;

public record MessageConversationResponse(
        Long id,
        Long partnerUserId,
        String partnerLoginId,
        String partnerName,
        String partnerNickname,
        String partnerProfileImage,
        UserRole partnerRole,
        String partnerJob,
        String partnerIntroduction,
        String partnerUrl,
        String lastMessage,
        LocalDateTime lastMessageAt,
        int unreadCount,
        boolean partnerAvailable,
        boolean partnerTyping
) {
}
