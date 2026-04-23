package com.example.pixel_project2.feed.controller;

import com.example.pixel_project2.common.dto.ApiResponse;
import com.example.pixel_project2.config.jwt.AuthenticatedUser;
import com.example.pixel_project2.feed.dto.CommentListResponse;
import com.example.pixel_project2.feed.dto.CreateCommentRequest;
import com.example.pixel_project2.feed.dto.CreateCommentResponse;
import com.example.pixel_project2.feed.dto.DeleteCommentResponse;
import com.example.pixel_project2.feed.dto.UpdateCommentResponse;
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
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/posts")
@RequiredArgsConstructor
public class PostCommentController {
    private final FeedService feedService;

    @GetMapping("/{postId}/comments")
    public ApiResponse<CommentListResponse> getComments(
            @PathVariable Long postId,
            @AuthenticationPrincipal AuthenticatedUser user
    ) {
        return ApiResponse.ok(
                "댓글 목록을 조회했습니다.",
                feedService.getComments(postId, user.id())
        );
    }

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

    @PatchMapping("/{postId}/comments/{commentId}")
    public ApiResponse<UpdateCommentResponse> updateComment(
            @PathVariable Long postId,
            @PathVariable Long commentId,
            @AuthenticationPrincipal AuthenticatedUser user,
            @Valid @RequestBody CreateCommentRequest request
    ) {
        return ApiResponse.ok(
                "댓글을 수정했습니다.",
                feedService.updateComment(postId, commentId, user.id(), request)
        );
    }

    @DeleteMapping("/{postId}/comments/{commentId}")
    public ApiResponse<DeleteCommentResponse> deleteComment(
            @PathVariable Long postId,
            @PathVariable Long commentId,
            @AuthenticationPrincipal AuthenticatedUser user
    ) {
        return ApiResponse.ok(
                "댓글을 삭제했습니다.",
                feedService.deleteComment(postId, commentId, user.id())
        );
    }
}
