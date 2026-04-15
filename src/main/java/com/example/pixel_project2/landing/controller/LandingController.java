package com.example.pixel_project2.landing.controller;

import com.example.pixel_project2.common.dto.ApiResponse;
import com.example.pixel_project2.landing.dto.LandingInfoResponse;
import com.example.pixel_project2.landing.service.LandingService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/landing")
@RequiredArgsConstructor
public class LandingController {
    private final LandingService landingService;

    @GetMapping
    public ApiResponse<LandingInfoResponse> getLanding() {
        return ApiResponse.ok("랜딩 정보를 조회했습니다.", landingService.getLandingInfo());
    }
}
