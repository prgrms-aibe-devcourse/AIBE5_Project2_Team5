package com.example.pixel_project2.message.dto;

import java.util.List;

public record MessageProcessResponse(
        Long id,
        String title,
        String status,
        MessageProcessConfirmationsResponse confirmations,
        List<MessageProcessTaskResponse> tasks
) {
}
