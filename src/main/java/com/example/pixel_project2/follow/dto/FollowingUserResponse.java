package com.example.pixel_project2.follow.dto;

import lombok.Builder;

@Builder
public record FollowingUserResponse(
        Long userId,
        String nickname,
        String name,
        String profileImage,
        String role
) {
}
