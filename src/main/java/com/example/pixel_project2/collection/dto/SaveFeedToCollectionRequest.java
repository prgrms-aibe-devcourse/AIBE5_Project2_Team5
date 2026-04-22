package com.example.pixel_project2.collection.dto;

import jakarta.validation.constraints.NotNull;

public record SaveFeedToCollectionRequest(
        @NotNull(message = "피드 ID가 필요합니다.")
        Long postId
) {
}
