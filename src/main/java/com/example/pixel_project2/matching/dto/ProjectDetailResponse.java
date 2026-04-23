package com.example.pixel_project2.matching.dto;

import java.util.List;

public record ProjectDetailResponse(
        Long postId,
        String postType,
        String category,
        String title,
        Integer budget,
        String overview,
        List<String> responsibilities,
        List<String> qualifications,
        String experienceLevel,
        String jobState,
        String deadline
) {
}
