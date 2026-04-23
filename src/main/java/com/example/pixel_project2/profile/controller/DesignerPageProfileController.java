package com.example.pixel_project2.profile.controller;

import com.example.pixel_project2.common.dto.ApiResponse;
import com.example.pixel_project2.config.jwt.AuthenticatedUser;
import com.example.pixel_project2.profile.dto.ProfileFeedResponse;
import com.example.pixel_project2.profile.dto.ProfileResponse;
import com.example.pixel_project2.profile.service.ProfileService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/designerPages")
@RequiredArgsConstructor
public class DesignerPageProfileController {
    private final ProfileService profileService;

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
}
