package com.example.pixel_project2.config.auth.service;

import com.example.pixel_project2.config.auth.dto.LoginRequest;
import com.example.pixel_project2.config.auth.dto.LoginResponse;
import com.example.pixel_project2.config.auth.dto.SignUpRequest;
import com.example.pixel_project2.config.auth.dto.SignUpResponse;

public interface AuthService {
    LoginResponse login(LoginRequest request);

    SignUpResponse signUp(SignUpRequest request);
}
