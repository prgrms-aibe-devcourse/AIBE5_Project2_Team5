package com.example.pixel_project2.message.dto;

public record MessageProcessTaskResponse(
        Long id,
        String text,
        boolean completed
) {
}
