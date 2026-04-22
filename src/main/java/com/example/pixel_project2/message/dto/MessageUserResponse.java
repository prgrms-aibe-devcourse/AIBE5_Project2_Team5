package com.example.pixel_project2.message.dto;

import com.example.pixel_project2.common.entity.enums.UserRole;

public record MessageUserResponse(
        Long userId,
        String loginId,
        String name,
        String nickname,
        String profileImage,
        UserRole role,
        String job,
        String introduction,
        String url
) {
}
