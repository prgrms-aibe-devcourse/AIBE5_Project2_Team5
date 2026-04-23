package com.example.pixel_project2.message.dto;

import jakarta.validation.constraints.NotNull;

public record CreateConversationRequest(
        @NotNull(message = "대화 상대를 선택해주세요.")
        Long partnerUserId
) {
}
