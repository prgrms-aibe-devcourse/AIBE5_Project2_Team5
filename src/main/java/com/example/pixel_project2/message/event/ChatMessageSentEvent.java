package com.example.pixel_project2.message.event;

import com.example.pixel_project2.message.dto.ChatMessageResponse;

public record ChatMessageSentEvent(ChatMessageResponse message) {
}
