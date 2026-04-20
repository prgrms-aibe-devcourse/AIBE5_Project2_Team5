package com.example.pixel_project2.config.auth.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record PasswordResetConfirmRequest(
        @NotBlank(message = "재설정 토큰이 필요합니다.")
        String token,
        @NotBlank(message = "새 비밀번호를 입력해주세요.")
        @Size(min = 8, max = 20, message = "새 비밀번호는 8자 이상 20자 이하로 입력해주세요.")
        String newPassword,
        @NotBlank(message = "새 비밀번호 확인을 입력해주세요.")
        @Size(min = 8, max = 20, message = "새 비밀번호 확인은 8자 이상 20자 이하로 입력해주세요.")
        String confirmPassword
) {
}
