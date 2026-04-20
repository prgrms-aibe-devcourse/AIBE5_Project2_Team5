package com.example.pixel_project2.matching.dto;

public record ProjectListItemResponse(
        Long postId,
        String category,
        String status,
        String title
) {
}
