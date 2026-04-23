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
        String location,
        Integer followCount,
        Long followerCount,
        Long followingCount,
        String job,
        String introduction,
        Float rating,
        String workStatus,
        String workType,
        String figmaUrl,
        String photoshopUrl,
        String adobeUrl,
        boolean owner,
        boolean following
) {
}
