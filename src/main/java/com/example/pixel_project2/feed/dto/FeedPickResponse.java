package com.example.pixel_project2.feed.dto;

public record FeedPickResponse(
        Long postId,
        boolean picked,
        Integer pickCount
) {
}
