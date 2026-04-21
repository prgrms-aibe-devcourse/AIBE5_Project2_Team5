package com.example.pixel_project2.common.entity.enums;

import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public enum Category {
    GRAPHIC_DESIGN("그래픽 디자인"),
    PHOTOGRAPHY("포토그래피"),
    ILLUSTRATION("일러스트레이션"),
    THREED_ART("3D Art"),
    UI_UX("UI/UX"),
    ARCHITECTURE("건축"),
    FASHION("패션"),
    ADVERTISEMENT("광고"),
    CRAFT("공예"),
    FINE_ART("미술"),
    PRODUCT_DESIGN("제품 디자인"),
    GAME_DESIGN("게임 디자인"),
    SOUND("사운드");

    private final String label;

    public static Category fromLabel(String label) {
        if (label == null) return null;
        String trimmedLabel = label.trim();
        for (Category category : Category.values()) {
            if (category.label.equalsIgnoreCase(trimmedLabel)) {
                return category;
            }
        }
        return null;
    }
}
