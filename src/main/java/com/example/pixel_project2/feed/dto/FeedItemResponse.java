package com.example.pixel_project2.feed.dto;

import java.util.List;

public record FeedItemResponse(
        Long postId,
        Long userId,
        String title,
        String description,
        String nickname,
        String profileKey,
        String profileImageUrl,
        String job,
        String role,
        String thumbnailUrl,
        Integer pickCount,
        Integer commentCount,
        String postType,
        String category,
        boolean picked,
        List<String> tags
) {
}
