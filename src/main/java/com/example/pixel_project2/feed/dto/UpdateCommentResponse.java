package com.example.pixel_project2.feed.dto;

public record UpdateCommentResponse(
        Long commentId,
        Long postId,
        String description
) {
}
