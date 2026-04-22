package com.example.pixel_project2.feed.dto;

import lombok.Builder;

import java.time.LocalDateTime;

@Builder
public record CreateFeedResponse(
        Long postId,
        String title,
        String description,
        Integer pickCount,
        Long commentCount,
        String category,
        String categoryCode,
        String portfolioUrl,
        LocalDateTime createdAt
) {
}
