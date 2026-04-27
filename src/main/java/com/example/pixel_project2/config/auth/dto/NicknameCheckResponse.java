package com.example.pixel_project2.config.auth.dto;

public record NicknameCheckResponse(
        String nickname,
        boolean available
) {
}
