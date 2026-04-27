package com.example.pixel_project2.matching.dto;

import java.util.List;

public record MyPostItemResponse(
        Long postId,
        String title,
        String overview,
        String profileImage,
        String category,
        List<String> categories,
        String projectState,
        String jobState,
        String deadline,
        String thumbnailImageUrl,
        List<String> imageUrls
) {
}
