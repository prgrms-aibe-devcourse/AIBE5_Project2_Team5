package com.example.pixel_project2.feed.dto;

import java.util.List;

public record FeedListResponse(
        List<FeedItemResponse> feeds,
        Long nextCursor,
        boolean hasNext
) {
}
