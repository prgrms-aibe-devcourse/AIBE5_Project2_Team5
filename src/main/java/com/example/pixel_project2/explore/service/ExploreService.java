package com.example.pixel_project2.explore.service;

import com.example.pixel_project2.explore.dto.ExploreDesignerResponseDto;
import com.example.pixel_project2.explore.dto.ExplorePostResponseDto;
import com.example.pixel_project2.explore.dto.ExplorePolicyResponse;

import java.util.List;

public interface ExploreService {
    // 피드 목록 조회 (카테고리, 페이징, 검색어 포함)
    List<ExplorePostResponseDto> getExploreFeeds(String category, int page, int size, String keyword);

    //탐색 페이지 정책 조회 (기존 코드 유지)
    ExplorePolicyResponse getExplorePolicy();

    // 디자이너 목록 조회 (검색, 페이징 포함)
    List<ExploreDesignerResponseDto> getExploreDesigners(String keyword, int page, int size);
}
