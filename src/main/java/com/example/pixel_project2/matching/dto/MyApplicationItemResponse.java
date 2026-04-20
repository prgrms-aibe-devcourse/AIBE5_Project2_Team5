package com.example.pixel_project2.matching.dto;

public record MyApplicationItemResponse(
        Long applicationId,
        Long postId,
        String title,
        Integer expectedBudget,
        String projectState,
        String deadline
) {
}
