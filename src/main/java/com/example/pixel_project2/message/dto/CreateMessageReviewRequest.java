package com.example.pixel_project2.message.dto;

import java.util.List;

public record CreateMessageReviewRequest(
        String projectTitle,
        Integer rating,
        String content,
        List<String> workCategories,
        List<String> complimentTags
) {
}
