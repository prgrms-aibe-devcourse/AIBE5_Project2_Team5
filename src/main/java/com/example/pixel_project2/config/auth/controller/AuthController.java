package com.example.pixel_project2.config.auth.controller;

import com.example.pixel_project2.config.auth.dto.LoginRequest;
import com.example.pixel_project2.config.auth.dto.LoginResponse;
import com.example.pixel_project2.config.auth.dto.SignUpRequest;
import com.example.pixel_project2.config.auth.dto.SignUpResponse;
import com.example.pixel_project2.config.auth.service.AuthService;
import com.example.pixel_project2.common.dto.ApiResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {
    private final AuthService authService;

    @PostMapping("/login")
    public ApiResponse<LoginResponse> login(@Valid @RequestBody LoginRequest request) {
        return ApiResponse.ok("로그인 요청을 처리했습니다.", authService.login(request));
    }

    @PostMapping("/signup")
    public ApiResponse<SignUpResponse> signUp(@Valid @RequestBody SignUpRequest request) {
        return ApiResponse.ok("회원가입 요청을 처리했습니다.", authService.signUp(request));
    }
}
