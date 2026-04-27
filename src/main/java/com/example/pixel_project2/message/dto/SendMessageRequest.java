package com.example.pixel_project2.message.dto;

import com.fasterxml.jackson.databind.JsonNode;
import jakarta.validation.constraints.Size;

public record SendMessageRequest(
        @Size(max = 100, message = "clientId는 100자 이하로 입력해주세요.")
        String clientId,

        @Size(max = 4000, message = "메시지는 4000자 이하로 입력해주세요.")
        String message,

        JsonNode attachments
) {
}
