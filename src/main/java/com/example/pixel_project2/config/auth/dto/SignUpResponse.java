package com.example.pixel_project2.config.auth.dto;

public record SignUpResponse(
        Long userId,
        String loginId,
        String nickname
) {
}
