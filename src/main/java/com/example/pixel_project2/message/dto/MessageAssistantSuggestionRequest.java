package com.example.pixel_project2.message.dto;

import jakarta.validation.constraints.Size;

public record MessageAssistantSuggestionRequest(
        @Size(max = 50, message = "goal must be 50 characters or fewer.")
        String goal,

        @Size(max = 4000, message = "draft must be 4000 characters or fewer.")
        String draft
) {
}
