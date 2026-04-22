package com.example.pixel_project2.profile.dto;

import lombok.Builder;

import java.time.LocalDateTime;
import java.util.List;

@Builder
public record ProfileReviewResponse(
        Long reviewId,
        Long projectId,
        String projectTitle,
        Long reviewerId,
        String reviewerName,
        String reviewerNickname,
        String reviewerProfileImage,
        Integer rating,
        String content,
        List<String> workCategories,
        List<String> complimentTags,
        LocalDateTime createdAt
) {
}
