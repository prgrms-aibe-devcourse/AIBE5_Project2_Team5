package com.example.pixel_project2.common.entity.enums;

import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public enum WorkStatus {
    AVAILABLE("Available"),
    UNAVAILABLE("Unavailable"),
    CONSULTATION_AVAILABLE("Consultation Available");

    private final String label;
}
