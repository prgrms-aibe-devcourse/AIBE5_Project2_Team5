package com.example.pixel_project2.matching.dto;

public record ApplyProjectRequest(
        String coverLetter,
        String summary,
        Integer expectedBudget,
        String portfolioUrl
) {
}
