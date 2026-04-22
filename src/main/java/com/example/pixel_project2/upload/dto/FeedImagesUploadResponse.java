package com.example.pixel_project2.upload.dto;

import java.util.List;

public record FeedImagesUploadResponse(
        Long postId,
        List<String> imageUrls,
        String thumbnailImageUrl
) {
}
