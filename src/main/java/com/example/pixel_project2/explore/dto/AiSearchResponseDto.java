package com.example.pixel_project2.explore.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.util.List;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AiSearchResponseDto {
    private String category;
    private List<String> keywords;
    private String message;
}
