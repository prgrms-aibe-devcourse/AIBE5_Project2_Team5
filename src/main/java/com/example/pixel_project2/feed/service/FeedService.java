package com.example.pixel_project2.feed.service;

import com.example.pixel_project2.common.entity.enums.PostType;
import com.example.pixel_project2.config.jwt.AuthenticatedUser;
import com.example.pixel_project2.feed.dto.CommentListResponse;
import com.example.pixel_project2.feed.dto.CreateCommentRequest;
import com.example.pixel_project2.feed.dto.CreateCommentResponse;
import com.example.pixel_project2.feed.dto.CreateFeedRequest;
import com.example.pixel_project2.feed.dto.CreateFeedResponse;
import com.example.pixel_project2.feed.dto.DeleteCommentResponse;
import com.example.pixel_project2.feed.dto.DeleteFeedResponse;
import com.example.pixel_project2.feed.dto.FeedDetailResponse;
import com.example.pixel_project2.feed.dto.FeedListResponse;
import com.example.pixel_project2.feed.dto.FeedPickResponse;
import com.example.pixel_project2.feed.dto.UpdateCommentResponse;

public interface FeedService {
    FeedListResponse getFeeds(PostType postType, Long cursor, int size, Long userId);

    FeedDetailResponse getFeedDetail(Long feedId, Long userId);

    FeedPickResponse toggleFeedPick(Long feedId, Long userId);

    CommentListResponse getComments(Long postId, Long userId);

    CreateCommentResponse createComment(Long postId, Long userId, CreateCommentRequest request);

    UpdateCommentResponse updateComment(Long postId, Long commentId, Long userId, CreateCommentRequest request);

    DeleteCommentResponse deleteComment(Long postId, Long commentId, Long userId);

    CreateFeedResponse createPortfolioFeed(AuthenticatedUser currentUser, CreateFeedRequest request);

    CreateFeedResponse updatePortfolioFeed(AuthenticatedUser currentUser, Long postId, CreateFeedRequest request);

    DeleteFeedResponse deletePortfolioFeed(AuthenticatedUser currentUser, Long postId);
}
