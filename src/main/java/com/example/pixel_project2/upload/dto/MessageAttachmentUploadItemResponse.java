package com.example.pixel_project2.upload.dto;

public record MessageAttachmentUploadItemResponse(
        String type,
        String name,
        String url,
        String contentType,
        long size
) {
}
