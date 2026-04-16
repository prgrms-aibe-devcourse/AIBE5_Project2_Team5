package com.example.pixel_project2.portfolio.dto;

public record PortfolioPolicyResponse(
        boolean supportsCreate,
        boolean supportsUpdate,
        boolean supportsDelete
) {
}
