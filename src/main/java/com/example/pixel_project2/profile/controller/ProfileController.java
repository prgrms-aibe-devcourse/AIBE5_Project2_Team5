package com.example.pixel_project2.profile.controller;

import com.example.pixel_project2.common.dto.ApiResponse;
import com.example.pixel_project2.config.jwt.AuthenticatedUser;
import com.example.pixel_project2.profile.dto.ProfileFeedResponse;
import com.example.pixel_project2.profile.dto.ProfileResponse;
import com.example.pixel_project2.profile.dto.ProfileReviewResponse;
import com.example.pixel_project2.profile.dto.UpdateDesignerProfileRequest;
import com.example.pixel_project2.profile.dto.UpdateProfileRequest;
import com.example.pixel_project2.profile.service.ProfileService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/profiles")
@RequiredArgsConstructor
public class ProfileController {
    private final ProfileService profileService;

    @GetMapping("/me")
    public ApiResponse<ProfileResponse> getMyProfile(@AuthenticationPrincipal AuthenticatedUser currentUser) {
        return ApiResponse.ok("Profile loaded.", profileService.getMyProfile(currentUser));
    }

    @GetMapping("/me/feeds")
    public ApiResponse<List<ProfileFeedResponse>> getMyProfileFeeds(@AuthenticationPrincipal AuthenticatedUser currentUser) {
        return ApiResponse.ok("Profile feeds loaded.", profileService.getMyProfileFeeds(currentUser));
    }

    @GetMapping("/me/reviews")
    public ApiResponse<List<ProfileReviewResponse>> getMyProfileReviews(@AuthenticationPrincipal AuthenticatedUser currentUser) {
        return ApiResponse.ok("Profile reviews loaded.", profileService.getMyProfileReviews(currentUser));
    }

    @PatchMapping("/me")
    public ApiResponse<ProfileResponse> updateMyProfile(
            @AuthenticationPrincipal AuthenticatedUser currentUser,
            @Valid @RequestBody UpdateProfileRequest request
    ) {
        return ApiResponse.ok("Profile updated.", profileService.updateMyProfile(currentUser, request));
    }

    @PutMapping("/me/designer")
    public ApiResponse<ProfileResponse> updateMyDesignerProfile(
            @AuthenticationPrincipal AuthenticatedUser currentUser,
            @Valid @RequestBody UpdateDesignerProfileRequest request
    ) {
        return ApiResponse.ok("Designer profile updated.", profileService.updateMyDesignerProfile(currentUser, request));
    }

    @GetMapping("/{profileKey}")
    public ApiResponse<ProfileResponse> getProfile(
            @PathVariable String profileKey,
            @AuthenticationPrincipal AuthenticatedUser currentUser
    ) {
        return ApiResponse.ok("Profile loaded.", profileService.getProfile(profileKey, currentUser));
    }

    @GetMapping("/{profileKey}/feeds")
    public ApiResponse<List<ProfileFeedResponse>> getProfileFeeds(
            @PathVariable String profileKey,
            @AuthenticationPrincipal AuthenticatedUser currentUser
    ) {
        return ApiResponse.ok("Profile feeds loaded.", profileService.getProfileFeeds(profileKey, currentUser));
    }

    @GetMapping("/{profileKey}/reviews")
    public ApiResponse<List<ProfileReviewResponse>> getProfileReviews(
            @PathVariable String profileKey,
            @AuthenticationPrincipal AuthenticatedUser currentUser
    ) {
        return ApiResponse.ok("Profile reviews loaded.", profileService.getProfileReviews(profileKey, currentUser));
    }
}
