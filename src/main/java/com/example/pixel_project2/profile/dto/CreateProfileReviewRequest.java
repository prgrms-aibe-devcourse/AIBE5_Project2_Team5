package com.example.pixel_project2.profile.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.util.List;

public record CreateProfileReviewRequest(
        @NotNull Long conversationId,
        @NotNull Long revieweeId,
        @NotBlank String projectTitle,
        @NotNull @Min(1) @Max(5) Integer rating,
        @NotBlank String content,
        List<String> workCategories,
        List<String> complimentTags
) {
}
