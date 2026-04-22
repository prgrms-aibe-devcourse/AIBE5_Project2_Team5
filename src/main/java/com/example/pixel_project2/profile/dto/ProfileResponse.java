package com.example.pixel_project2.profile.dto;

import lombok.Builder;

@Builder
public record ProfileResponse(
        Long userId,
        String loginId,
        String name,
        String nickname,
        String role,
        String profileImage,
        String url,
        Integer followCount,
        Long followerCount,
        Long followingCount,
        String job,
        String introduction,
        Float rating,
        String workStatus,
        String workType,
        boolean owner,
        boolean following
) {
}
