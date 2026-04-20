package com.example.pixel_project2.common.entity.enums;

import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public enum WorkStatus {
    AVAILABLE("Available"), // 가능
    UNAVAILABLE("Unavailable"), // 불가능
    CONSULTATION_AVAILABLE("Consultation Available"); // 상담후 가능

    private final String label;
}
