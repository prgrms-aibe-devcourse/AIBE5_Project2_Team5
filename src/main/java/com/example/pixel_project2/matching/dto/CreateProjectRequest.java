package com.example.pixel_project2.matching.dto;

import java.time.LocalDate;
import java.util.List;

public record CreateProjectRequest(
        String postType,
        String title,
        String category,
        String jobState,
        String experienceLevel,
        Integer budget,
        String overview,
        String fullDescription,
        List<String> skills,
        List<String> responsibilities,
        List<String> qualifications,
        String state,
        LocalDate deadline
) {
}
