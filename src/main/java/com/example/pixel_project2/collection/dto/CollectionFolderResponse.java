package com.example.pixel_project2.collection.dto;

import lombok.Builder;

import java.time.LocalDateTime;
import java.util.List;

@Builder
public record CollectionFolderResponse(
        Long folderId,
        String folderName,
        Long ownerId,
        String ownerNickname,
        Long itemCount,
        List<String> previewImageUrls,
        LocalDateTime createdAt
) {
}
