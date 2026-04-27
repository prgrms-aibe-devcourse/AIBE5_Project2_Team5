package com.example.pixel_project2.matching.dto;

import java.util.List;

public record ProjectListItemResponse(
        Long id,
        String nickname,
        String profileImage,
        String companyName,
        String category,
        List<String> categories,
        String title,
        String overview,
        String budget,
        String experienceLevel,
        String jobState,
        String deadline,
        String thumbnailImageUrl,
        List<String> imageUrls
) {
}
