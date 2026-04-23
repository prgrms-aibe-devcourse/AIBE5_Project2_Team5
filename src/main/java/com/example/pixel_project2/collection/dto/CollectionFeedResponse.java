package com.example.pixel_project2.collection.dto;

import lombok.Builder;

import java.time.LocalDateTime;
import java.util.List;

@Builder
public record CollectionFeedResponse(
        Long postId,
        Long authorId,
        String authorNickname,
        String authorProfileImage,
        String title,
        String description,
        String category,
        String categoryCode,
        Integer pickCount,
        Long commentCount,
        String thumbnailImageUrl,
        List<String> imageUrls,
        LocalDateTime createdAt
) {
}
