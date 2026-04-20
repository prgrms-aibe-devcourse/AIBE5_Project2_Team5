package com.example.pixel_project2.explore.dto;

import lombok.Builder;

//탐색 페이지의 피드 목록 조회 시 사용되는 데이터 전송 객체(DTO)

@Builder
public record ExplorePostResponseDto(
        Long postId,      // 게시글 고유 ID
        String title,     // 게시글 제목
        String nickname,  // 작성자 닉네임
        Integer pickCount, // 좋아요(픽) 수
        String imageUrl   // 대표 이미지 URL
) {
}
