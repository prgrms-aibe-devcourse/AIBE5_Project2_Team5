package com.example.pixel_project2.matching.controller;

import com.example.pixel_project2.common.dto.ApiResponse;
import com.example.pixel_project2.matching.dto.MatchingPolicyResponse;
import com.example.pixel_project2.matching.service.MatchingService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/matchings")
@RequiredArgsConstructor
public class MatchingController {
    private final MatchingService matchingService;

    @GetMapping("/policy")
    public ApiResponse<MatchingPolicyResponse> getCounterProposalPolicy() {
        return ApiResponse.ok("역제안 정책을 조회했습니다.", matchingService.getCounterProposalPolicy());
    }
}
