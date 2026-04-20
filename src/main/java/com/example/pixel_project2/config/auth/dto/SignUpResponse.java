package com.example.pixel_project2.config.auth.dto;

public record SignUpResponse(
        Long userId,
        String loginId,
        String nickname,
        String role //프론트에서 클라, 디자이너 구분 가능


) {


}
