package com.example.pixel_project2.feed.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import java.util.List;

public record CreateFeedRequest(
        @NotBlank(message = "Title is required.")
        @Size(max = 100, message = "Title must be 100 characters or less.")
        String title,

        @NotBlank(message = "Description is required.")
        String description,

        @NotBlank(message = "Category is required.")
        String category,

        @Size(max = 200, message = "Portfolio URL must be 200 characters or less.")
        String portfolioUrl,

        List<String> tags
) {
}
