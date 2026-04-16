package com.example.pixel_project2.home.controller;

import com.example.pixel_project2.common.dto.ApiResponse;
import com.example.pixel_project2.home.dto.HomeFeedPolicyResponse;
import com.example.pixel_project2.home.service.HomeService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/home")
@RequiredArgsConstructor
public class HomeController {
    private final HomeService homeService;

    @GetMapping("/feed")
    public ApiResponse<HomeFeedPolicyResponse> getFeed() {
        return ApiResponse.ok("홈 피드 정책을 조회했습니다.", homeService.getHomeFeedPolicy());
    }
}
