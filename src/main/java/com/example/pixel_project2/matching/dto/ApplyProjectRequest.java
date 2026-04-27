package com.example.pixel_project2.matching.dto;

import java.time.LocalDate;

public record ApplyProjectRequest(
        String coverLetter,
        String summary,
        Integer expectedBudget,
        String portfolioUrl,
        LocalDate startDate
) {
}
