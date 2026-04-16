package com.example.pixel_project2.mypage.dto;

public record MyPagePolicyResponse(
        boolean supportsNicknameUpdate,
        boolean supportsProfileImageUpdate
) {
}
