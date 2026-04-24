package com.example.pixel_project2.message.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record ToggleMessageReactionRequest(
        @NotBlank(message = "emoji is required.")
        @Size(max = 50, message = "emoji can be up to 50 characters.")
        String emoji
) {
}
