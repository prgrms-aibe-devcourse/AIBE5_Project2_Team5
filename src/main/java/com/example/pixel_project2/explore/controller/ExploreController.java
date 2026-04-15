package com.example.pixel_project2.explore.controller;

import com.example.pixel_project2.common.dto.ApiResponse;
import com.example.pixel_project2.explore.dto.ExplorePolicyResponse;
import com.example.pixel_project2.explore.service.ExploreService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/explore")
@RequiredArgsConstructor
public class ExploreController {
    private final ExploreService exploreService;

    @GetMapping
    public ApiResponse<ExplorePolicyResponse> getExplore() {
        return ApiResponse.ok("탐색 정책을 조회했습니다.", exploreService.getExplorePolicy());
    }
}
