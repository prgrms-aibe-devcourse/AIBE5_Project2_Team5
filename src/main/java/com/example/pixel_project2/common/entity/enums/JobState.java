package com.example.pixel_project2.common.entity.enums;

import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public enum JobState {
    SHORT("단기"), MID("중기"), LONG("장기");

    private final String label;
}
