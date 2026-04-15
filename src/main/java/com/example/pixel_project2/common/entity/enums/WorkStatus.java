package com.example.pixel_project2.common.entity.enums;

import lombok.AllArgsConstructor;

@AllArgsConstructor
public enum WorkStatus {
    AVAILABLE("작업가능"), UNAVAILABLE("의뢰 불가"), CONSULTATION_REQUIRED("문의 필요");

    private final String name;
}
