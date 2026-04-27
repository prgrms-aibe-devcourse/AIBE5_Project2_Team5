package com.example.pixel_project2.follow.service;

import com.example.pixel_project2.config.jwt.AuthenticatedUser;
import com.example.pixel_project2.follow.dto.FollowResponse;
import com.example.pixel_project2.follow.dto.FollowingUserResponse;

import java.util.List;

public interface FollowService {
    FollowResponse follow(AuthenticatedUser currentUser, Long targetUserId);

    FollowResponse unfollow(AuthenticatedUser currentUser, Long targetUserId);

    List<FollowingUserResponse> getFollowingUsers(AuthenticatedUser currentUser);
}
