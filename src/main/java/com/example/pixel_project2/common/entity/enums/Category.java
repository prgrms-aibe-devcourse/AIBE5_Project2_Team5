package com.example.pixel_project2.common.entity.enums;

import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public enum Category {
    GRAPHIC_DESIGN("Graphic Design"), // 그래픽 디자인
    PHOTOGRAPHY("Photography"), // 포토그래피
    ILLUSTRATION("Illustration"), // 일러스트레이션
    THREED_ART("3D Art"), // 3D아트
    UI_UX("UI/UX"), // UI/UX
    ARCHITECTURE("Architecture"), // 건축
    FASHION("Fashion"), // 패션
    ADVERTISEMENT("Advertisement"), // 광고
    CRAFT("Craft"), // 공예
    FINE_ART("Fine Art"), // 미술
    PRODUCT_DESIGN("Product Design"), // 제품 디자인
    GAME_DESIGN("Game Design"), // 게임 디자인
    SOUND("Sound"); // 사운드

    private final String label;
}
