package com.example.pixel_project2.config.auth.dto;

public record CurrentUserResponse(
        Long userId,
        String loginId,
        String name,
        String nickname,
        String role
) {
}
