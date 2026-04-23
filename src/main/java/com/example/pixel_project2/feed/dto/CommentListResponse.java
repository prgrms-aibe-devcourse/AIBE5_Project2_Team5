package com.example.pixel_project2.feed.dto;

import java.util.List;

public record CommentListResponse(
        List<CommentItemResponse> comments
) {
}
