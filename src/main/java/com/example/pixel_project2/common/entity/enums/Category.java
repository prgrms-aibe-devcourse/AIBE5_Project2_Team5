package com.example.pixel_project2.common.entity.enums;

import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public enum Category {
    GRAPHIC_DESIGN("그래픽 디자인"), // 그래픽 디자인
    PHOTOGRAPHY("포토그래피"), // 포토그래피
    ILLUSTRATION("일러스트레이션"), // 일러스트레이션
    THREED_ART("3D Art"), // 3D아트
    UI_UX("UI/UX"), // UI/UX
    ARCHITECTURE("건축"), // 건축
    FASHION("패션"), // 패션
    ADVERTISEMENT("광고"), // 광고
    CRAFT("공예"), // 공예
    FINE_ART("미술"), // 미술
    PRODUCT_DESIGN("제품 디자인"), // 제품 디자인
    GAME_DESIGN("게임 디자인"), // 게임 디자인
    SOUND("사운드"); // 사운드

    private final String label;
}
