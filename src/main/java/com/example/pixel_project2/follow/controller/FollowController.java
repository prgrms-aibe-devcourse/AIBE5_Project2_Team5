package com.example.pixel_project2.follow.controller;

import com.example.pixel_project2.common.dto.ApiResponse;
import com.example.pixel_project2.config.jwt.AuthenticatedUser;
import com.example.pixel_project2.follow.dto.FollowResponse;
import com.example.pixel_project2.follow.dto.FollowingUserResponse;
import com.example.pixel_project2.follow.service.FollowService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/follows")
@RequiredArgsConstructor
public class FollowController {
    private final FollowService followService;

    @PostMapping("/{userId}")
    public ApiResponse<FollowResponse> follow(
            @AuthenticationPrincipal AuthenticatedUser currentUser,
            @PathVariable Long userId
    ) {
        return ApiResponse.ok("팔로우했습니다.", followService.follow(currentUser, userId));
    }

    @DeleteMapping("/{userId}/unfollow")
    public ApiResponse<FollowResponse> unfollow(
            @AuthenticationPrincipal AuthenticatedUser currentUser,
            @PathVariable Long userId
    ) {
        return ApiResponse.ok("팔로우를 취소했습니다.", followService.unfollow(currentUser, userId));
    }

    @GetMapping("/following")
    public ApiResponse<List<FollowingUserResponse>> getFollowing(
            @AuthenticationPrincipal AuthenticatedUser currentUser
    ) {
        return ApiResponse.ok("팔로잉 목록을 불러왔습니다.", followService.getFollowingUsers(currentUser));
    }
}
