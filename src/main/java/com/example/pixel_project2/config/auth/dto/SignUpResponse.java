package com.example.pixel_project2.config.auth.dto;

public record SignUpResponse(
        String accessToken,
        String refreshToken,
        Long userId,
        String loginId,
        String name,
        String nickname,
        String role
) {
}
