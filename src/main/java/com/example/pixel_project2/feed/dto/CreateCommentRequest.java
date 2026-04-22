package com.example.pixel_project2.feed.dto;

import jakarta.validation.constraints.NotBlank;

public record CreateCommentRequest(
        @NotBlank(message = "댓글 내용을 입력해주세요.")
        String description
) {
}
