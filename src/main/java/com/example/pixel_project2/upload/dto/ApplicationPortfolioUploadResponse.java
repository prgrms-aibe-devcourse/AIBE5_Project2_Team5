package com.example.pixel_project2.upload.dto;

public record ApplicationPortfolioUploadResponse(
        Long postId,
        String fileUrl,
        String fileName,
        String contentType,
        long size
) {
}
