package com.example.pixel_project2.explore.controller;

import com.example.pixel_project2.common.dto.ApiResponse;
import com.example.pixel_project2.explore.dto.AiSearchRequestDto;
import com.example.pixel_project2.explore.dto.AiSearchResponseDto;
import com.example.pixel_project2.explore.service.AiSearchService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/explore/ai")
@RequiredArgsConstructor
public class AiSearchController {

    private final AiSearchService aiSearchService;

    @PostMapping("/search")
    public ApiResponse<AiSearchResponseDto> search(@RequestBody AiSearchRequestDto request) {
        AiSearchResponseDto response = aiSearchService.search(request.getQuery());
        return ApiResponse.ok("AI 검색 분석이 완료되었습니다.", response);
    }
}
