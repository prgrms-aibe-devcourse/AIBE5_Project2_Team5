package com.example.pixel_project2.explore.controller;

import com.example.pixel_project2.common.dto.ApiResponse;
import com.example.pixel_project2.explore.dto.ExplorePostResponseDto;
import com.example.pixel_project2.explore.service.ExploreService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/explore")
@RequiredArgsConstructor
public class ExploreController {

    private final ExploreService exploreService;

    // 피드 목록 조회 (카테고리별 필터링, 검색, 페이징 포함)
    @GetMapping
    public ApiResponse<List<ExplorePostResponseDto>> getExploreFeeds(
            @RequestParam(required = false) String category,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(required = false) String keyword) {

        List<ExplorePostResponseDto> response = exploreService.getExploreFeeds(category, page, size, keyword);

        return ApiResponse.ok("탐색 피드 조회가 완료되었습니다.", response);
    }

    // 디자이너 목록 조회 (검색, 페이징 포함)
    @GetMapping("/designers")
    public ApiResponse<List<com.example.pixel_project2.explore.dto.ExploreDesignerResponseDto>> getExploreDesigners(
            @RequestParam(required = false) String keyword,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        
        List<com.example.pixel_project2.explore.dto.ExploreDesignerResponseDto> response = exploreService.getExploreDesigners(keyword, page, size);
        
        return ApiResponse.ok("디자이너 목록 조회가 완료되었습니다.", response);
    }
}
