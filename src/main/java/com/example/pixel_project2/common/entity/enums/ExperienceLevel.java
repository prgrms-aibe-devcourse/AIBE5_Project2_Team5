package com.example.pixel_project2.common.entity.enums;

import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public enum ExperienceLevel {
    JUNIOR("신입"), MID("3년 이상"), SENIOR("시니어");

    private final String label;
}
