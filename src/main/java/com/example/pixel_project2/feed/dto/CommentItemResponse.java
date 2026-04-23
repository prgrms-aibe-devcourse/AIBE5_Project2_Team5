package com.example.pixel_project2.feed.dto;

public record CommentItemResponse(
        Long commentId,
        Long userId,
        String nickname,
        String profileImageUrl,
        String role,
        String description,
        String timeText,
        boolean mine
) {
}
