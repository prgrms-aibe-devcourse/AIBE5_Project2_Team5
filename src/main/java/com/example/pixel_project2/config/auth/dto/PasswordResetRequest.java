package com.example.pixel_project2.config.auth.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record PasswordResetRequest(
        @NotBlank(message = "이메일을 입력해주세요.")
        @Email(message = "이메일에는 @를 포함해서 입력해주세요.")
        String loginId,
        @NotBlank(message = "이름을 입력해주세요.")
        @Size(min = 2, max = 30, message = "이름은 2자 이상 30자 이하로 입력해주세요.")
        String name,
        @NotBlank(message = "닉네임을 입력해주세요.")
        @Size(max = 10, message = "닉네임은 10자 이하로 입력해주세요.")
        String nickname,
        @NotBlank(message = "새 비밀번호를 입력해주세요.")
        @Size(min = 8, max = 20, message = "새 비밀번호는 8자 이상 20자 이하로 입력해주세요.")
        String newPassword,
        @NotBlank(message = "새 비밀번호 확인을 입력해주세요.")
        @Size(min = 8, max = 20, message = "새 비밀번호 확인은 8자 이상 20자 이하로 입력해주세요.")
        String confirmPassword
) {
}
