package com.example.pixel_project2.config.auth.controller;

import com.example.pixel_project2.common.entity.enums.UserRole;
import com.example.pixel_project2.config.oauth.OAuth2SessionKeys;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;

import java.io.IOException;

@Controller
@RequestMapping("/api/auth/oauth2")
public class OAuth2AuthorizationController {

    @GetMapping("/google")
    public void startGoogleLogin(
            @RequestParam(required = false) String mode,
            @RequestParam(required = false) String role,
            @RequestParam(required = false) String nickname,
            @RequestParam(required = false) String email,
            @RequestParam(required = false) String redirectTo,
            HttpServletRequest request,
            HttpServletResponse response
    ) throws IOException {
        startSocialLogin("google", mode, role, nickname, email, redirectTo, request, response);
    }

    @GetMapping("/kakao")
    public void startKakaoLogin(
            @RequestParam(required = false) String mode,
            @RequestParam(required = false) String role,
            @RequestParam(required = false) String nickname,
            @RequestParam(required = false) String email,
            @RequestParam(required = false) String redirectTo,
            HttpServletRequest request,
            HttpServletResponse response
    ) throws IOException {
        startSocialLogin("kakao", mode, role, nickname, email, redirectTo, request, response);
    }

    private void startSocialLogin(
            String provider,
            String mode,
            String role,
            String nickname,
            String email,
            String redirectTo,
            HttpServletRequest request,
            HttpServletResponse response
    ) throws IOException {
        HttpSession session = request.getSession(true);
        session.setAttribute(OAuth2SessionKeys.MODE, normalizeMode(mode));
        session.setAttribute(OAuth2SessionKeys.ROLE, normalizeRole(role).name());
        session.setAttribute(OAuth2SessionKeys.REDIRECT_TO, normalizeRedirectTo(redirectTo));
        session.setAttribute(OAuth2SessionKeys.NICKNAME, normalizeNickname(nickname));
        session.setAttribute(OAuth2SessionKeys.EMAIL, normalizeEmail(email));
        response.sendRedirect("/oauth2/authorization/" + provider);
    }

    private UserRole normalizeRole(String role) {
        if (role == null) {
            return UserRole.DESIGNER;
        }

        try {
            return UserRole.valueOf(role.trim().toUpperCase());
        } catch (IllegalArgumentException e) {
            return UserRole.DESIGNER;
        }
    }

    private String normalizeMode(String mode) {
        if ("signup".equalsIgnoreCase(mode)) {
            return "signup";
        }
        return "login";
    }

    private String normalizeRedirectTo(String redirectTo) {
        if (redirectTo == null || redirectTo.isBlank()) {
            return "/feed";
        }

        String trimmed = redirectTo.trim();
        if (!trimmed.startsWith("/") || trimmed.startsWith("//")) {
            return "/feed";
        }
        return trimmed;
    }

    private String normalizeNickname(String nickname) {
        if (nickname == null) {
            return "";
        }

        String trimmed = nickname.trim();
        if (trimmed.length() > 10) {
            return trimmed.substring(0, 10);
        }
        return trimmed;
    }

    private String normalizeEmail(String email) {
        if (email == null) {
            return "";
        }
        return email.trim();
    }
}
