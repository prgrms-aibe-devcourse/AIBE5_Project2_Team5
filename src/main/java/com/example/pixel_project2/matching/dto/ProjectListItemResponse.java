package com.example.pixel_project2.matching.dto;

import java.util.List;

public record ProjectListItemResponse(
        Long id,
        String title,
        String description,
        String fullDescription,
        String category,
        List<String> skills,
        String budget,
        String deadline,
        String imageUrl,
        String projectType,
        String experienceLevel
) {
}
