package com.example.pixel_project2.message.dto;

public record MessageReactionResponse(
        String emoji,
        long count,
        boolean reactedByMe
) {
}
