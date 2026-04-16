package com.example.pixel_project2.explore.dto;

public record ExplorePolicyResponse(
        boolean supportsGrid,
        boolean supportsCategoryFilter,
        boolean supportsSearchTab
) {
}
