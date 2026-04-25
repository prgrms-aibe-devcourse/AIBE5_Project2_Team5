package com.example.pixel_project2.upload.dto;

public record StoredFile(
        String key,
        String url,
        String contentType,
        long size
) {
}
