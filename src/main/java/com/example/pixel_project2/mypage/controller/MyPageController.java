package com.example.pixel_project2.mypage.controller;

import com.example.pixel_project2.common.dto.ApiResponse;
import com.example.pixel_project2.mypage.dto.MyPagePolicyResponse;
import com.example.pixel_project2.mypage.service.MyPageService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/mypage")
@RequiredArgsConstructor
public class MyPageController {
    private final MyPageService myPageService;

    @GetMapping("/policy")
    public ApiResponse<MyPagePolicyResponse> getMyPagePolicy() {
        return ApiResponse.ok("마이페이지 정책을 조회했습니다.", myPageService.getMyPagePolicy());
    }
}
