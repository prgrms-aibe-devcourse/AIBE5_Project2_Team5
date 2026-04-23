package com.example.pixel_project2.message.dto;

import java.util.List;

public record MessageProcessRequest(
        Long id,
        String title,
        MessageProcessConfirmationsRequest confirmations,
        List<MessageProcessTaskRequest> tasks
) {
}
