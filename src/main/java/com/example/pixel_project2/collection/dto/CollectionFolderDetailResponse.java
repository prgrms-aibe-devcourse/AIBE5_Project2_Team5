package com.example.pixel_project2.collection.dto;

import lombok.Builder;

import java.time.LocalDateTime;
import java.util.List;

@Builder
public record CollectionFolderDetailResponse(
        Long folderId,
        String folderName,
        Long ownerId,
        String ownerNickname,
        LocalDateTime createdAt,
        List<CollectionFeedResponse> feeds
) {
}
