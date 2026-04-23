package com.example.pixel_project2.config.auth.service;

import com.example.pixel_project2.config.auth.dto.LoginRequest;
import com.example.pixel_project2.config.auth.dto.LoginResponse;
import com.example.pixel_project2.config.auth.dto.NicknameCheckResponse;
import com.example.pixel_project2.config.auth.dto.PasswordResetConfirmRequest;
import com.example.pixel_project2.config.auth.dto.PasswordResetEmailRequest;
import com.example.pixel_project2.config.auth.dto.PasswordResetEmailResponse;
import com.example.pixel_project2.config.auth.dto.PasswordResetResponse;
import com.example.pixel_project2.config.auth.dto.SignUpRequest;
import com.example.pixel_project2.config.auth.dto.SignUpResponse;

public interface AuthService {
    LoginResponse login(LoginRequest request);

    SignUpResponse signUp(SignUpRequest request);

    NicknameCheckResponse checkNickname(String nickname);

    PasswordResetEmailResponse sendPasswordResetEmail(PasswordResetEmailRequest request);

    PasswordResetResponse resetPassword(PasswordResetConfirmRequest request);
}
