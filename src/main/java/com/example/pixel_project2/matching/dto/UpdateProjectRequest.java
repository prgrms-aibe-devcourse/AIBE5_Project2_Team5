package com.example.pixel_project2.matching.dto;

public record UpdateProjectRequest(
        String title,
        Integer budget,
        String overview,
        String responsibilities,
        String qualifications,
        String deadline
) {
}
