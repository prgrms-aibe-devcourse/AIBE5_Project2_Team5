package com.example.pixel_project2.portfolio.controller;

import com.example.pixel_project2.common.dto.ApiResponse;
import com.example.pixel_project2.portfolio.dto.PortfolioPolicyResponse;
import com.example.pixel_project2.portfolio.service.PortfolioService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/portfolio")
@RequiredArgsConstructor
public class PortfolioController {
    private final PortfolioService portfolioService;

    @GetMapping("/policy")
    public ApiResponse<PortfolioPolicyResponse> getPortfolioPolicy() {
        return ApiResponse.ok("피드형 포트폴리오 정책을 조회했습니다.", portfolioService.getPortfolioPolicy());
    }
}
