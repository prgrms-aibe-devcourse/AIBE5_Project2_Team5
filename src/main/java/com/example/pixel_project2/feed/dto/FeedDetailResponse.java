package com.example.pixel_project2.feed.dto;

import java.time.LocalDateTime;
import java.util.List;

public record FeedDetailResponse(
        Long postId,
        Long userId,
        String title,
        String description,
        String nickname,
        String profileKey,
        String profileImageUrl,
        String job,
        String role,
        String postType,
        String category,
        Integer pickCount,
        Long commentCount,
        String portfolioUrl,
        LocalDateTime createdAt,
        List<String> imageUrls,
        boolean picked,
        boolean mine
) {
}
