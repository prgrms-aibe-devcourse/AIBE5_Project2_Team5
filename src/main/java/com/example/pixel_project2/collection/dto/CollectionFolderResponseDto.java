package com.example.pixel_project2.collection.dto;

import java.util.List;

public record CollectionFolderResponseDto(
        Long folderId,
        String folderName,
        List<Long> itemIds
) {
}
