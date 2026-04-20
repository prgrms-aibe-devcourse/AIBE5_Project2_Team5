package com.example.pixel_project2.config.auth.dto;

public record LoginResponse(
        String accessToken,
        String refreshToken,
        Long userId,
        String loginId,
        String nickname,
        String role,
        String profileImage
) {
}
