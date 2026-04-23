package com.example.pixel_project2.matching.dto;

public record ProjectListItemResponse(
        Long id,
        String nickname,
        String companyName,
        String category,
        String title,
        String overview,
        String budget,
        String experienceLevel,
        String jobState,
        String deadline
) {
}
