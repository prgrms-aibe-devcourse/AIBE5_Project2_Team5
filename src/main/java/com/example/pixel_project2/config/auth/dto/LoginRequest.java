package com.example.pixel_project2.config.auth.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Email;

public record LoginRequest(
        @NotBlank(message = "이메일을 입력해주세요.")
        @Email(message = "이메일에는 @를 포함해서 입력해주세요.")
        String loginId,
        @NotBlank String password
) {
}
