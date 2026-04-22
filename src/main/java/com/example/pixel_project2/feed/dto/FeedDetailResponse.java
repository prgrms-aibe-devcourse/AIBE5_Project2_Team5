package com.example.pixel_project2.feed.dto;

import java.time.LocalDateTime;
import java.util.List;

public record FeedDetailResponse(
        Long postId,
        Long userId,
        String title,
        String description,
        String nickname,
        String profileImageUrl,
        String role,
        String postType,
        String category,
        Integer pickCount,
        Long commentCount,
        String portfolioUrl,
        LocalDateTime createdAt,
        List<String> imageUrls,
        boolean mine
) {
}
