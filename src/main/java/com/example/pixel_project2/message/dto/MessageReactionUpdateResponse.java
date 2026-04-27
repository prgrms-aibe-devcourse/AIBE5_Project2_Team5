package com.example.pixel_project2.message.dto;

import java.util.List;

public record MessageReactionUpdateResponse(
        Long messageId,
        List<MessageReactionSummaryResponse> reactions
) {
}
