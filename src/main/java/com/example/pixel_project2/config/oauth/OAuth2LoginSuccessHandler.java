package com.example.pixel_project2.config.oauth;

import com.example.pixel_project2.common.entity.enums.UserRole;
import com.example.pixel_project2.config.auth.dto.LoginResponse;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.client.authentication.OAuth2AuthenticationToken;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.security.web.authentication.AuthenticationSuccessHandler;
import org.springframework.stereotype.Component;
import org.springframework.web.util.UriComponentsBuilder;

import java.io.IOException;

@Component
@RequiredArgsConstructor
public class OAuth2LoginSuccessHandler implements AuthenticationSuccessHandler {
    private final GoogleOAuth2LoginService googleOAuth2LoginService;
    private final KakaoOAuth2LoginService kakaoOAuth2LoginService;

    @Value("${app.oauth2.success-redirect-uri}")
    private String successRedirectUri;

    @Override
    public void onAuthenticationSuccess(
            HttpServletRequest request,
            HttpServletResponse response,
            Authentication authentication
    ) throws IOException {
        String registrationId = resolveRegistrationId(authentication);
        try {
            OAuth2User oauth2User = (OAuth2User) authentication.getPrincipal();
            String requestedMode = resolveRequestedMode(request);
            UserRole requestedRole = resolveRequestedRole(request);
            String requestedName = resolveRequestedName(request);
            String requestedNickname = resolveRequestedNickname(request);
            String requestedEmail = resolveRequestedEmail(request);
            String redirectTo = resolveRedirectTo(request);
            LoginResponse loginResponse = loginOrSignUp(
                    registrationId,
                    oauth2User,
                    requestedMode,
                    requestedRole,
                    requestedName,
                    requestedNickname,
                    requestedEmail
            );

            SecurityContextHolder.clearContext();
            clearOAuthSession(request, response);
            response.sendRedirect(buildSuccessRedirectUri(loginResponse, redirectTo));
        } catch (Exception e) {
            SecurityContextHolder.clearContext();
            clearOAuthSession(request, response);
            response.sendRedirect(buildFailureRedirectUri(e.getMessage(), providerLabel(registrationId)));
        }
    }

    private String resolveRegistrationId(Authentication authentication) {
        if (authentication instanceof OAuth2AuthenticationToken oauth2AuthenticationToken) {
            return oauth2AuthenticationToken.getAuthorizedClientRegistrationId();
        }
        return "google";
    }

    private LoginResponse loginOrSignUp(
            String registrationId,
            OAuth2User oauth2User,
            String requestedMode,
            UserRole requestedRole,
            String requestedName,
            String requestedNickname,
            String requestedEmail
    ) {
        if ("kakao".equalsIgnoreCase(registrationId)) {
            return kakaoOAuth2LoginService.loginOrSignUp(oauth2User, requestedMode, requestedRole, requestedName, requestedNickname, requestedEmail);
        }
        return googleOAuth2LoginService.loginOrSignUp(oauth2User, requestedMode, requestedRole, requestedName, requestedNickname);
    }

    private UserRole resolveRequestedRole(HttpServletRequest request) {
        Object value = getAndRemoveSessionAttribute(request, OAuth2SessionKeys.ROLE);
        if (value == null) {
            return UserRole.DESIGNER;
        }

        try {
            return UserRole.valueOf(String.valueOf(value));
        } catch (IllegalArgumentException e) {
            return UserRole.DESIGNER;
        }
    }

    private String resolveRequestedMode(HttpServletRequest request) {
        Object value = getAndRemoveSessionAttribute(request, OAuth2SessionKeys.MODE);
        if ("signup".equals(String.valueOf(value))) {
            return "signup";
        }
        return "login";
    }

    private String resolveRedirectTo(HttpServletRequest request) {
        Object value = getAndRemoveSessionAttribute(request, OAuth2SessionKeys.REDIRECT_TO);
        if (value == null) {
            return "/feed";
        }
        return String.valueOf(value);
    }

    private String resolveRequestedNickname(HttpServletRequest request) {
        Object value = getAndRemoveSessionAttribute(request, OAuth2SessionKeys.NICKNAME);
        if (value == null) {
            return "";
        }
        return String.valueOf(value);
    }

    private String resolveRequestedName(HttpServletRequest request) {
        Object value = getAndRemoveSessionAttribute(request, OAuth2SessionKeys.NAME);
        if (value == null) {
            return "";
        }
        return String.valueOf(value);
    }

    private String resolveRequestedEmail(HttpServletRequest request) {
        Object value = getAndRemoveSessionAttribute(request, OAuth2SessionKeys.EMAIL);
        if (value == null) {
            return "";
        }
        return String.valueOf(value);
    }

    private Object getAndRemoveSessionAttribute(HttpServletRequest request, String key) {
        HttpSession session = request.getSession(false);
        if (session == null) {
            return null;
        }

        Object value = session.getAttribute(key);
        session.removeAttribute(key);
        return value;
    }

    private void clearOAuthSession(HttpServletRequest request, HttpServletResponse response) {
        HttpSession session = request.getSession(false);
        if (session != null) {
            session.invalidate();
        }

        Cookie cookie = new Cookie("JSESSIONID", null);
        cookie.setPath("/");
        cookie.setHttpOnly(true);
        cookie.setMaxAge(0);
        response.addCookie(cookie);
    }

    private String buildSuccessRedirectUri(LoginResponse response, String redirectTo) {
        return UriComponentsBuilder.fromUriString(successRedirectUri)
                .queryParam("accessToken", response.accessToken())
                .queryParam("refreshToken", response.refreshToken())
                .queryParam("userId", response.userId())
                .queryParam("loginId", response.loginId())
                .queryParam("name", response.name())
                .queryParam("nickname", response.nickname())
                .queryParam("role", response.role())
                .queryParam("profileImage", response.profileImage())
                .queryParam("redirectTo", redirectTo)
                .build()
                .encode()
                .toUriString();
    }

    private String buildFailureRedirectUri(String message, String providerLabel) {
        return UriComponentsBuilder.fromUriString(successRedirectUri)
                .queryParam("provider", providerLabel)
                .queryParam("error", message == null || message.isBlank() ? providerLabel + " 로그인에 실패했습니다." : message)
                .build()
                .encode()
                .toUriString();
    }

    private String providerLabel(String registrationId) {
        if ("kakao".equalsIgnoreCase(registrationId)) {
            return "Kakao";
        }
        return "Google";
    }
}
