package com.example.pixel_project2.feed.controller;

import com.example.pixel_project2.common.dto.ApiResponse;
import com.example.pixel_project2.common.entity.enums.PostType;
import com.example.pixel_project2.feed.dto.FeedListResponse;
import com.example.pixel_project2.feed.dto.FeedPolicyResponse;
import com.example.pixel_project2.feed.service.FeedService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
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
            @RequestParam(required = false) PostType postType
    ) {
        return ApiResponse.ok("피드 목록을 조회했습니다.", feedService.getFeeds(postType));
    }

    @GetMapping("/{feedId}")
    public ApiResponse<FeedPolicyResponse> getFeedDetail(@PathVariable Long feedId) {
        return ApiResponse.ok("피드 상세 정책을 조회했습니다. feedId=" + feedId, feedService.getFeedDetailPolicy());
    }
}
