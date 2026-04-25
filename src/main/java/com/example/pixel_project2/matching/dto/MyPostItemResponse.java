package com.example.pixel_project2.matching.dto;

public record MyPostItemResponse(
        Long postId,
        String title,
        String overview,      // 💡 추가
        String category,      // 💡 추가
        String projectState,  // 💡 추가 (백엔드 엔티티의 state)
        String jobState,      // 💡 추가 (단기/중기/장기)
        String deadline
) {
}
