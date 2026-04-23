package com.example.pixel_project2.upload.dto;

public record MessageAttachmentUploadResponse(
        String url,
        String fileName,
        String contentType,
        long size
) {
}
