package com.example.pixel_project2.matching.dto;

import java.util.List;

public record ProjectDetailResponse(
        Long postId,
        String postType,
        String category,
        String title,
        Integer budget,
        String overview,
        String fullDescription,
        List<String> responsibilities,
        List<String> qualifications,
        List<String> skills,
        String experienceLevel,
        String jobState,
        String deadline
) {
}
