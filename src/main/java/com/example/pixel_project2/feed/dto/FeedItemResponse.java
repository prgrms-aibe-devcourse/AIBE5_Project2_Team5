package com.example.pixel_project2.feed.dto;

public record FeedItemResponse(
        Long postId,
        Long userId,
        String title,
        String nickname,
        String thumbnailUrl,
        Integer pickCount,
        Integer commentCount,
        String postType,
        String category
) {
}
