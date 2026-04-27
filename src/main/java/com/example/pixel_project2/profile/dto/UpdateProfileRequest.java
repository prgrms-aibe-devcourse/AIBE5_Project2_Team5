package com.example.pixel_project2.profile.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record UpdateProfileRequest(
        @NotBlank(message = "Name is required.")
        @Size(max = 30, message = "Name must be 30 characters or less.")
        String name,

        @NotBlank(message = "Nickname is required.")
        @Size(max = 10, message = "Nickname must be 10 characters or less.")
        String nickname,

        @Size(max = 255, message = "URL must be 255 characters or less.")
        String url,

        @Size(max = 100, message = "Location must be 100 characters or less.")
        String location
) {
}
