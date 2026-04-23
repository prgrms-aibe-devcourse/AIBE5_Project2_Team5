package com.example.pixel_project2.profile.dto;

import lombok.Builder;

import java.time.LocalDateTime;
import java.util.List;

@Builder
public record ProfileFeedResponse(
        Long postId,
        String title,
        String description,
        Integer pickCount,
        Long commentCount,
        String category,
        String categoryCode,
        String portfolioUrl,
        List<String> imageUrls,
        String thumbnailImageUrl,
        List<String> tags,
        LocalDateTime createdAt
) {
}
