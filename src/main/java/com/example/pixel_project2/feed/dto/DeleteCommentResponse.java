package com.example.pixel_project2.feed.dto;

public record DeleteCommentResponse(
        Long commentId,
        Long postId
) {
}
