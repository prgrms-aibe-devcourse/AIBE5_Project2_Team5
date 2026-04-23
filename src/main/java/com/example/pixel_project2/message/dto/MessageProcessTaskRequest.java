package com.example.pixel_project2.message.dto;

public record MessageProcessTaskRequest(
        Long id,
        String text,
        Boolean completed
) {
}
