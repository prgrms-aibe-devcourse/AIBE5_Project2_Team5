package com.example.pixel_project2.common.entity.enums;

import lombok.AllArgsConstructor;
import lombok.Getter;

@AllArgsConstructor
public enum Category {
    그래픽디자인("그래픽 디자인"), 포토그래피("포토그래피"), 일러스트레이션("일러스트레이션"),
    Art_3D("3D art"), UI_UX("UI/UX"), 건축("건축"), 패션("패션"),
    광고("광고"), 공예("공예"), 미술("미술"), 제품디자인("제품디자인"),
    게임디자인("게임디자인"), 사운드("사운드");

    private String name;

}
