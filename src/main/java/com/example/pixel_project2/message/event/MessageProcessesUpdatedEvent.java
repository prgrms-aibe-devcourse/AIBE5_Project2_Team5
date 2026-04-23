package com.example.pixel_project2.message.event;

import com.example.pixel_project2.message.dto.MessageProcessResponse;

import java.util.List;

public record MessageProcessesUpdatedEvent(
        Long conversationId,
        List<MessageProcessResponse> processes
) {
}
