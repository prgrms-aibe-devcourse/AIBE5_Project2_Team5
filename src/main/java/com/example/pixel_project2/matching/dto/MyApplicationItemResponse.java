package com.example.pixel_project2.matching.dto;

public record MyApplicationItemResponse(
        Long applicationId,
        Long postId,
        String title,
        String overview,
        String profileImage,
        Integer expectedBudget,
        String projectState,
        String jobState,
        String category,
        java.util.List<String> categories,
        String deadline,
        String thumbnailImageUrl,
        java.util.List<String> imageUrls
) {
}
