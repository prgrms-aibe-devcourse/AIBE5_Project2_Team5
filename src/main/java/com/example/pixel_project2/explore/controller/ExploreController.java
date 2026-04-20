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

    // 피드 목록 조회 (카테고리별 필터링 포함)
    @GetMapping
    public ApiResponse<List<ExplorePostResponseDto>> getExploreFeeds(
            @RequestParam(required = false) String category) {
        
        List<ExplorePostResponseDto> response = exploreService.getExploreFeeds(category);
        
        return ApiResponse.ok("탐색 피드 조회가 완료되었습니다.", response);
    }
}
