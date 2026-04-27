package com.example.pixel_project2.matching.dto;

public record ProjectApplicationItemResponse(
        Long applicationId,
        Long designerId,
        String designerName,
        String designerNickname,
        String designerProfileImage,
        Integer expectedBudget,
        String summary,
        String coverLetter,
        String portfolioUrl,
        String startDate
) {
}
