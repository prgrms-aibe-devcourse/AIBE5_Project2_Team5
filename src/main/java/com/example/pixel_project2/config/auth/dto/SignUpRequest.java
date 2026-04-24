package com.example.pixel_project2.config.auth.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record SignUpRequest(
        @NotBlank String loginId,
        @NotBlank @Size(min = 8) String password,
        @NotBlank String nickname,
        @NotBlank String role
) {
}
