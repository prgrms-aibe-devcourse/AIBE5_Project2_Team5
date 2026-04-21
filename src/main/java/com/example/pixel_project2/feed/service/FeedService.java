package com.example.pixel_project2.feed.service;

import com.example.pixel_project2.config.jwt.AuthenticatedUser;
import com.example.pixel_project2.feed.dto.CreateFeedRequest;
import com.example.pixel_project2.feed.dto.CreateFeedResponse;
import com.example.pixel_project2.feed.dto.DeleteFeedResponse;
import com.example.pixel_project2.feed.dto.FeedPolicyResponse;

public interface FeedService {
    FeedPolicyResponse getFeedDetailPolicy();

    CreateFeedResponse createPortfolioFeed(AuthenticatedUser currentUser, CreateFeedRequest request);

    CreateFeedResponse updatePortfolioFeed(AuthenticatedUser currentUser, Long postId, CreateFeedRequest request);

    DeleteFeedResponse deletePortfolioFeed(AuthenticatedUser currentUser, Long postId);
}
