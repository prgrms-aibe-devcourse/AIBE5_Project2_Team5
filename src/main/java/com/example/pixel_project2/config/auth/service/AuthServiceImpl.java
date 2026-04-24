package com.example.pixel_project2.config.auth.service;

import com.example.pixel_project2.config.auth.dto.LoginRequest;
import com.example.pixel_project2.config.auth.dto.LoginResponse;
import com.example.pixel_project2.config.auth.dto.SignUpRequest;
import com.example.pixel_project2.config.auth.dto.SignUpResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class AuthServiceImpl implements AuthService {
    private final PasswordEncoder passwordEncoder;

    @Override
    public LoginResponse login(LoginRequest request) {
        return new LoginResponse("temp-access-token", "temp-refresh-token");
    }

    @Override
    public SignUpResponse signUp(SignUpRequest request) {
        String encodedPassword = passwordEncoder.encode(request.password());
        // TODO: Save the user with encodedPassword to the database
        System.out.println("Encoded password: " + encodedPassword);
        
        return new SignUpResponse(1L, request.loginId(), request.nickname());
    }
}
