package com.example.pixel_project2.matching.dto;

public record ProjectDetailResponse(
        Long postId,
        String postType,
        String category,
        String title,
        Integer budget,
        String overview,
        String responsibilities,
        String qualifications,
        String state,
        String deadline
) {
}
