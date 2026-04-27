package com.example.pixel_project2.follow.dto;

import lombok.Builder;

@Builder
public record FollowResponse(
        Long targetUserId,
        boolean following,
        Long followerCount,
        Long followingCount
) {
}
