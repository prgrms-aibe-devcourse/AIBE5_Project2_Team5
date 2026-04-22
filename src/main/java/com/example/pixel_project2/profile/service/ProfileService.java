package com.example.pixel_project2.profile.service;

import com.example.pixel_project2.config.jwt.AuthenticatedUser;
import com.example.pixel_project2.profile.dto.ProfileFeedResponse;
import com.example.pixel_project2.profile.dto.ProfileResponse;
import com.example.pixel_project2.profile.dto.UpdateDesignerProfileRequest;
import com.example.pixel_project2.profile.dto.UpdateProfileRequest;

import java.util.List;

public interface ProfileService {
    ProfileResponse getMyProfile(AuthenticatedUser currentUser);

    ProfileResponse getProfile(String profileKey, AuthenticatedUser currentUser);

    List<ProfileFeedResponse> getMyProfileFeeds(AuthenticatedUser currentUser);

    List<ProfileFeedResponse> getProfileFeeds(String profileKey, AuthenticatedUser currentUser);

    ProfileResponse updateMyProfile(AuthenticatedUser currentUser, UpdateProfileRequest request);

    ProfileResponse updateMyDesignerProfile(AuthenticatedUser currentUser, UpdateDesignerProfileRequest request);
}
