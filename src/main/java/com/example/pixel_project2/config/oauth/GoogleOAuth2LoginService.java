package com.example.pixel_project2.config.oauth;

import com.example.pixel_project2.common.entity.User;
import com.example.pixel_project2.common.entity.enums.Provider;
import com.example.pixel_project2.common.entity.enums.UserRole;
import com.example.pixel_project2.common.repository.UserRepository;
import com.example.pixel_project2.config.auth.dto.LoginResponse;
import com.example.pixel_project2.config.jwt.JwtTokenProvider;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
@RequiredArgsConstructor
public class GoogleOAuth2LoginService {
    private static final int NAME_MAX_LENGTH = 30;
    private static final int NICKNAME_MAX_LENGTH = 10;

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider jwtTokenProvider;

    @Transactional
    public LoginResponse loginOrSignUp(
            OAuth2User oauth2User,
            String requestedMode,
            UserRole requestedRole,
            String requestedNickname
    ) {
        String email = stringAttribute(oauth2User, "email");
        if (email.isBlank()) {
            throw new IllegalArgumentException("Google email was not provided.");
        }

        if (!booleanAttribute(oauth2User, "email_verified")) {
            throw new IllegalArgumentException("Google email must be verified.");
        }

        String name = normalizeName(stringAttribute(oauth2User, "name"), email);
        String picture = stringAttribute(oauth2User, "picture");
        boolean signupMode = "signup".equals(requestedMode);

        User user = userRepository.findByloginId(email)
                .map(existingUser -> loginExistingUser(existingUser, picture, signupMode))
                .orElseGet(() -> createGoogleUser(email, name, picture, requestedRole, requestedNickname, signupMode));

        return new LoginResponse(
                jwtTokenProvider.createAccessToken(user),
                "",
                user.getId(),
                user.getLoginId(),
                user.getName(),
                user.getNickname(),
                user.getRole().name(),
                user.getProfileImage()
        );
    }

    private User loginExistingUser(User user, String picture, boolean signupMode) {
        if (signupMode) {
            throw new IllegalArgumentException("이미 가입된 이메일입니다. 로그인해주세요.");
        }
        return updateGoogleProfile(user, picture);
    }

    private User updateGoogleProfile(User user, String picture) {
        if (!picture.isBlank() && (user.getProfileImage() == null || user.getProfileImage().isBlank())) {
            user.setProfileImage(picture);
        }
        return user;
    }

    private User createGoogleUser(
            String email,
            String name,
            String picture,
            UserRole requestedRole,
            String requestedNickname,
            boolean signupMode
    ) {
        if (!signupMode) {
            throw new IllegalArgumentException("가입된 계정이 없습니다. Google 회원가입을 먼저 진행해주세요.");
        }

        String nickname = normalizeRequestedNickname(requestedNickname, name);

        User user = User.builder()
                .loginId(email)
                .password(passwordEncoder.encode(UUID.randomUUID().toString()))
                .name(name)
                .nickname(nickname)
                .profileImage(picture.isBlank() ? null : picture)
                .role(requestedRole == null ? UserRole.DESIGNER : requestedRole)
                .provider(Provider.GOOGLE)
                .build();

        return userRepository.save(user);
    }

    private String normalizeRequestedNickname(String requestedNickname, String name) {
        String nickname = requestedNickname == null ? "" : requestedNickname.trim();
        if (nickname.isBlank()) {
            return createUniqueNickname(name);
        }

        if (nickname.length() > NICKNAME_MAX_LENGTH) {
            throw new IllegalArgumentException("Nickname must be 10 characters or fewer.");
        }
        if (userRepository.countByNickname(nickname) > 0) {
            throw new IllegalArgumentException("Nickname is already in use.");
        }

        return nickname;
    }

    private String createUniqueNickname(String name) {
        String base = trimToLength(name.isBlank() ? "GoogleUser" : name, NICKNAME_MAX_LENGTH);
        String candidate = base;
        int suffix = 1;

        while (userRepository.countByNickname(candidate) > 0) {
            String suffixText = String.valueOf(suffix++);
            int prefixLength = Math.max(1, NICKNAME_MAX_LENGTH - suffixText.length());
            candidate = trimToLength(base, prefixLength) + suffixText;
        }

        return candidate;
    }

    private String normalizeName(String name, String email) {
        String value = name == null || name.isBlank() ? email.substring(0, email.indexOf("@")) : name.trim();
        return trimToLength(value, NAME_MAX_LENGTH);
    }

    private String stringAttribute(OAuth2User oauth2User, String key) {
        Object value = oauth2User.getAttribute(key);
        return value == null ? "" : String.valueOf(value).trim();
    }

    private boolean booleanAttribute(OAuth2User oauth2User, String key) {
        Object value = oauth2User.getAttribute(key);
        if (value instanceof Boolean booleanValue) {
            return booleanValue;
        }
        return Boolean.parseBoolean(String.valueOf(value));
    }

    private String trimToLength(String value, int maxLength) {
        if (value.length() <= maxLength) {
            return value;
        }
        return value.substring(0, maxLength);
    }
}
