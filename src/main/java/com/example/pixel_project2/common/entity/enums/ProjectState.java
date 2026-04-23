package com.example.pixel_project2.common.entity.enums;

import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public enum ProjectState {
    OPEN("모집중"), CLOSED("모집완료");

    private final String label;
}
