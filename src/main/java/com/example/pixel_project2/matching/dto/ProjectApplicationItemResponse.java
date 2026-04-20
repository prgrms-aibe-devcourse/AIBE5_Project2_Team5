package com.example.pixel_project2.matching.dto;

public record ProjectApplicationItemResponse(
        Long applicationId,
        Long designerId,
        String designerName,
        Integer expectedBudget,
        String summary
) {
}
