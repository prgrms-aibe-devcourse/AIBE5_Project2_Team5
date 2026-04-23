package com.example.pixel_project2.feed.dto;

public record FeedItemResponse(
        Long postId,
        String title,
        String nickname,
        String thumbnailUrl,
        Integer pickCount,
        Integer commentCount,
        String postType,
        String category,
        boolean picked
) {
}
