package com.example.pixel_project2.matching.dto;

public record MatchingPolicyResponse(
        boolean clientCanWrite,
        boolean designerCanComment,
        boolean supportsRecruitmentStatus
) {
}
