package com.example.pixel_project2.matching.dto;

import java.util.List;

// 옆에 작성할 필터링
public record FilteringResponse(
    List<String> jobStates,
    List<String> experienceLevels,
    List<String> categories
) {
}
