package com.example.pixel_project2.explore.service;

import com.example.pixel_project2.explore.dto.ExplorePostResponseDto;
import com.example.pixel_project2.explore.dto.ExplorePolicyResponse;
import java.util.List;

public interface ExploreService {
    //탐색 피드 목록 조회
     
    List<ExplorePostResponseDto> getExploreFeeds(String categoryName);

    //탐색 페이지 정책 조회 (기존 코드 유지)
     
    ExplorePolicyResponse getExplorePolicy();
}
