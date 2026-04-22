package com.example.pixel_project2.feed.service;

import com.example.pixel_project2.common.entity.enums.PostType;
import com.example.pixel_project2.feed.dto.CreateCommentRequest;
import com.example.pixel_project2.feed.dto.CreateCommentResponse;
import com.example.pixel_project2.feed.dto.FeedListResponse;
import com.example.pixel_project2.feed.dto.FeedPolicyResponse;

public interface FeedService {
    FeedListResponse getFeeds(PostType postType);

    FeedPolicyResponse getFeedDetailPolicy();

    CreateCommentResponse createComment(Long postId, Long userId, CreateCommentRequest request);
}
