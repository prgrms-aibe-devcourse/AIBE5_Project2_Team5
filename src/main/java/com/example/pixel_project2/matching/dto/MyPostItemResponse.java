package com.example.pixel_project2.matching.dto;

public record MyPostItemResponse(
        Long postId,
        String title,
        Integer budget,
        String projectState,
        String deadline
) {
}
