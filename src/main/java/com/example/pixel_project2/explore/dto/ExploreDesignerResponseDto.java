package com.example.pixel_project2.explore.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

// 탐색 페이지의 프로필(디자이너) 목록 조회 시 사용되는 데이터 전송 객체(DTO)
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ExploreDesignerResponseDto {
    private Long userId;          // 디자이너 고유 ID
    private String nickname;      // 닉네임 (활동명)
    private String profileImage;  // 아바타 (프로필 이미지 URL)
    private String job;           // 직업/직무
    private Integer followCount;  // 팔로워 수
    private Long postCount;       // 작업물(포트폴리오) 수
    private String introduction;  // 자기소개 (bio)
    private String bannerImage;   // 배너 이미지 (가장 최근 피드 이미지)

    // JPQL 조회용 생성자 (bannerImage는 서비스 계층에서 채움)
    public ExploreDesignerResponseDto(Long userId, String nickname, String profileImage, String job, Integer followCount, Long postCount, String introduction) {
        this.userId = userId;
        this.nickname = nickname;
        this.profileImage = profileImage;
        this.job = job;
        this.followCount = followCount;
        this.postCount = postCount;
        this.introduction = introduction;
    }
}
