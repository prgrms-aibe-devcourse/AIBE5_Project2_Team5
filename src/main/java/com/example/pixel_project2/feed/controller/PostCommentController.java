package com.example.pixel_project2.feed.controller;

import com.example.pixel_project2.common.dto.ApiResponse;
import com.example.pixel_project2.config.jwt.AuthenticatedUser;
import com.example.pixel_project2.feed.dto.CreateCommentRequest;
import com.example.pixel_project2.feed.dto.CreateCommentResponse;
import com.example.pixel_project2.feed.service.FeedService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/posts")
@RequiredArgsConstructor
public class PostCommentController {
    private final FeedService feedService;

    @PostMapping("/{postId}/comments")
    public ApiResponse<CreateCommentResponse> createComment(
            @PathVariable Long postId,
            @AuthenticationPrincipal AuthenticatedUser user,
            @Valid @RequestBody CreateCommentRequest request
    ) {
        return ApiResponse.ok(
                "댓글을 등록했습니다.",
                feedService.createComment(postId, user.id(), request)
        );
    }
}
