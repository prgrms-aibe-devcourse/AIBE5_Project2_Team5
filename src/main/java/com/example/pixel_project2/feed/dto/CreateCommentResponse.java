package com.example.pixel_project2.feed.dto;

public record CreateCommentResponse(
        Long commentId,
        Long postId,
        Long userId,
        String nickname,
        String profileImageUrl,
        String description
) {
}
