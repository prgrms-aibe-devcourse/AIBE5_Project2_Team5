package com.example.pixel_project2.home.dto;

public record HomeFeedPolicyResponse(
        String priorityRule,
        boolean supportsInfiniteScroll
) {
}
