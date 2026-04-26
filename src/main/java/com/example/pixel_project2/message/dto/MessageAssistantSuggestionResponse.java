package com.example.pixel_project2.message.dto;

import java.util.List;

public record MessageAssistantSuggestionResponse(
        String goal,
        List<String> suggestions,
        boolean usedAi
) {
}
