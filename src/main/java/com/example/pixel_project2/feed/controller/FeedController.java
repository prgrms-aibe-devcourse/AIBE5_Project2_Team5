package com.example.pixel_project2.feed.controller;

import com.example.pixel_project2.common.dto.ApiResponse;
import com.example.pixel_project2.common.entity.enums.PostType;
import com.example.pixel_project2.config.jwt.AuthenticatedUser;
import com.example.pixel_project2.feed.dto.CreateFeedRequest;
import com.example.pixel_project2.feed.dto.CreateFeedResponse;
import com.example.pixel_project2.feed.dto.DeleteFeedResponse;
import com.example.pixel_project2.feed.dto.FeedDetailResponse;
import com.example.pixel_project2.feed.dto.FeedListResponse;
import com.example.pixel_project2.feed.dto.FeedPickResponse;
import com.example.pixel_project2.feed.service.FeedService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/feeds")
@RequiredArgsConstructor
public class FeedController {
    private final FeedService feedService;

    @GetMapping
    public ApiResponse<FeedListResponse> getFeeds(
            @AuthenticationPrincipal AuthenticatedUser currentUser,
            @RequestParam(required = false) PostType postType,
            @RequestParam(required = false) Long cursor,
            @RequestParam(defaultValue = "10") int size
    ) {
        return ApiResponse.ok("피드 목록을 조회했습니다.", feedService.getFeeds(postType, cursor, size, currentUser.id()));
    }

    @GetMapping("/{feedId}")
    public ApiResponse<FeedDetailResponse> getFeedDetail(
            @PathVariable Long feedId,
            @AuthenticationPrincipal AuthenticatedUser currentUser
    ) {
        return ApiResponse.ok(
                "피드 상세를 조회했습니다.",
                feedService.getFeedDetail(feedId, currentUser.id())
        );
    }

    @PostMapping("/{feedId}/like")
    public ApiResponse<FeedPickResponse> toggleFeedPick(
            @PathVariable Long feedId,
            @AuthenticationPrincipal AuthenticatedUser currentUser
    ) {
        return ApiResponse.ok("피드 좋아요 상태를 변경했습니다.", feedService.toggleFeedPick(feedId, currentUser.id()));
    }

    @PostMapping
    public ApiResponse<CreateFeedResponse> createFeed(
            @AuthenticationPrincipal AuthenticatedUser currentUser,
            @Valid @RequestBody CreateFeedRequest request
    ) {
        return ApiResponse.ok("Feed created.", feedService.createPortfolioFeed(currentUser, request));
    }

    @PostMapping("/new")
    public ApiResponse<CreateFeedResponse> createNewFeed(
            @AuthenticationPrincipal AuthenticatedUser currentUser,
            @Valid @RequestBody CreateFeedRequest request
    ) {
        return ApiResponse.ok("Feed created.", feedService.createPortfolioFeed(currentUser, request));
    }

    @PatchMapping("/{feedId}")
    public ApiResponse<CreateFeedResponse> updateFeed(
            @AuthenticationPrincipal AuthenticatedUser currentUser,
            @PathVariable Long feedId,
            @Valid @RequestBody CreateFeedRequest request
    ) {
        return ApiResponse.ok("Feed updated.", feedService.updatePortfolioFeed(currentUser, feedId, request));
    }

    @DeleteMapping("/{feedId}")
    public ApiResponse<DeleteFeedResponse> deleteFeed(
            @AuthenticationPrincipal AuthenticatedUser currentUser,
            @PathVariable Long feedId
    ) {
        return ApiResponse.ok("Feed deleted.", feedService.deletePortfolioFeed(currentUser, feedId));
    }
}
