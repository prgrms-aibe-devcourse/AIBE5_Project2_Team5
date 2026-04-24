package com.example.pixel_project2.message.dto;

public record MessageReactionSummaryResponse(
        String emoji,
        long count,
        boolean reactedByMe
) {
}
