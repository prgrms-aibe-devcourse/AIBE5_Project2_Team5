package com.example.pixel_project2.message.dto;

public record MessageProcessConfirmationsRequest(
        boolean designer,
        boolean client
) {
}
