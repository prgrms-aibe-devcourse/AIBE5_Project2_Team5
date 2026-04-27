package com.example.pixel_project2.message.dto;

public record MessagePolicyResponse(
        boolean supportsChatHistory,
        boolean supportsMessageList,
        boolean supportsRealtime
) {
}
