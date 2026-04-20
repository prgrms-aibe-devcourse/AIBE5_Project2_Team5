package com.example.pixel_project2.common.entity.enums;

import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public enum Category {
    GRAPHIC_DESIGN("Graphic Design"),
    PHOTOGRAPHY("Photography"),
    ILLUSTRATION("Illustration"),
    THREED_ART("3D Art"),
    UI_UX("UI/UX"),
    ARCHITECTURE("Architecture"),
    FASHION("Fashion"),
    ADVERTISEMENT("Advertisement"),
    CRAFT("Craft"),
    FINE_ART("Fine Art"),
    PRODUCT_DESIGN("Product Design"),
    GAME_DESIGN("Game Design"),
    SOUND("Sound");

    private final String label;
}
