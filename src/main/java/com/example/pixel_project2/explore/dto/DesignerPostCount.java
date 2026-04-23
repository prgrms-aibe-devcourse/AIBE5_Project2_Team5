package com.example.pixel_project2.explore.dto;

public record DesignerPostCount(
        Long userId,
        String nickname,
        String profileImage,
        String job,
        Integer followCount,
        long postCount
) { }
