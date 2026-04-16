package com.example.pixel_project2.feed.dto;

public record FeedPolicyResponse(
        boolean supportsLike,
        boolean supportsComment,
        boolean supportsCollection
) {
}
