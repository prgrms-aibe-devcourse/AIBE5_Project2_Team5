package com.example.pixel_project2.config.jwt;

import com.example.pixel_project2.common.entity.enums.UserRole;

public record AuthenticatedUser(
        Long id,
        String loginId,
        String name,
        String nickname,
        UserRole role
) {
}
