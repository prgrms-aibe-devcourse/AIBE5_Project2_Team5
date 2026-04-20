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

import java.util.Locale;
import java.util.Map;
import java.util.UUID;
import java.util.regex.Pattern;

@Service
@RequiredArgsConstructor
public class KakaoOAuth2LoginService {
    private static final int EMAIL_MAX_LENGTH = 30;
    private static final int NAME_MAX_LENGTH = 30;
    private static final int NICKNAME_MAX_LENGTH = 10;
    private static final Pattern EMAIL_PATTERN = Pattern.compile("^\\S+@\\S+$");

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider jwtTokenProvider;

    @Transactional
    public LoginResponse loginOrSignUp(
            OAuth2User oauth2User,
            String requestedMode,
            UserRole requestedRole,
            String requestedNickname,
            String requestedEmail
    ) {
        Map<String, Object> kakaoAccount = mapAttribute(oauth2User, "kakao_account");
        Map<String, Object> profile = mapAttribute(kakaoAccount, "profile");

        String kakaoId = stringAttribute(oauth2User, "id");
        if (kakaoId.isBlank()) {
            kakaoId = oauth2User.getName();
        }
        if (kakaoId == null || kakaoId.isBlank()) {
            throw new IllegalArgumentException("Kakao id was not provided.");
        }
        String providerId = kakaoId;

        String profileNickname = firstNotBlank(
                stringAttribute(profile, "nickname"),
                stringAttribute(mapAttribute(oauth2User, "properties"), "nickname")
        );
        String name = normalizeName(profileNickname, kakaoId);
        String picture = firstNotBlank(
                stringAttribute(profile, "profile_image_url"),
                stringAttribute(mapAttribute(oauth2User, "properties"), "profile_image")
        );
        boolean signupMode = "signup".equals(requestedMode);

        User user = userRepository.findByProviderAndProviderId(Provider.KAKAO, providerId)
                .or(() -> userRepository.findByLoginId(createLegacyKakaoLoginId(providerId))
                        .filter(existingUser -> existingUser.getProvider() == Provider.KAKAO))
                .map(existingUser -> loginExistingUser(existingUser, providerId, picture, signupMode))
                .orElseGet(() -> createKakaoUser(
                        providerId,
                        requestedEmail,
                        name,
                        picture,
                        requestedRole,
                        requestedNickname,
                        signupMode
                ));

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

    private User loginExistingUser(User user, String providerId, String picture, boolean signupMode) {
        if (signupMode) {
            throw new IllegalArgumentException("이미 가입된 카카오 계정입니다. 로그인해주세요.");
        }
        if (user.getProviderId() == null || user.getProviderId().isBlank()) {
            user.setProviderId(providerId);
        }
        return updateKakaoProfile(user, picture);
    }

    private User updateKakaoProfile(User user, String picture) {
        if (!picture.isBlank() && (user.getProfileImage() == null || user.getProfileImage().isBlank())) {
            user.setProfileImage(picture);
        }
        return user;
    }

    private User createKakaoUser(
            String providerId,
            String requestedEmail,
            String name,
            String picture,
            UserRole requestedRole,
            String requestedNickname,
            boolean signupMode
    ) {
        if (!signupMode) {
            throw new IllegalArgumentException("가입된 계정이 없습니다. Kakao 회원가입을 먼저 진행해주세요.");
        }

        String email = normalizeRequestedEmail(requestedEmail);
        if (userRepository.countByLoginId(email) > 0) {
            throw new IllegalArgumentException("이미 가입된 이메일입니다. 다른 이메일을 입력하거나 로그인해주세요.");
        }
        String nickname = normalizeRequestedNickname(requestedNickname, name);

        User user = User.builder()
                .loginId(email)
                .password(passwordEncoder.encode(UUID.randomUUID().toString()))
                .name(name)
                .nickname(nickname)
                .profileImage(picture.isBlank() ? null : picture)
                .role(requestedRole == null ? UserRole.DESIGNER : requestedRole)
                .provider(Provider.KAKAO)
                .providerId(providerId)
                .followCount(0)
                .build();

        return userRepository.save(user);
    }

    private String normalizeRequestedEmail(String requestedEmail) {
        String email = requestedEmail == null ? "" : requestedEmail.trim().toLowerCase(Locale.ROOT);
        if (email.isBlank()) {
            throw new IllegalArgumentException("카카오 회원가입은 이메일을 입력해야 합니다.");
        }
        if (email.length() > EMAIL_MAX_LENGTH) {
            throw new IllegalArgumentException("이메일은 30자 이하로 입력해주세요.");
        }
        if (!EMAIL_PATTERN.matcher(email).matches()) {
            throw new IllegalArgumentException("이메일에 @를 포함해서 입력해주세요.");
        }
        return email;
    }

    private String normalizeRequestedNickname(String requestedNickname, String name) {
        String nickname = requestedNickname == null ? "" : requestedNickname.trim();
        if (nickname.isBlank()) {
            return createUniqueNickname(name);
        }

        if (nickname.length() > NICKNAME_MAX_LENGTH) {
            throw new IllegalArgumentException("닉네임은 10자 이하로 입력해주세요.");
        }
        if (userRepository.countByNickname(nickname) > 0) {
            throw new IllegalArgumentException("이미 사용 중인 닉네임입니다.");
        }

        return nickname;
    }

    private String createUniqueNickname(String name) {
        String base = trimToLength(name.isBlank() ? "KakaoUser" : name, NICKNAME_MAX_LENGTH);
        String candidate = base;
        int suffix = 1;

        while (userRepository.countByNickname(candidate) > 0) {
            String suffixText = String.valueOf(suffix++);
            int prefixLength = Math.max(1, NICKNAME_MAX_LENGTH - suffixText.length());
            candidate = trimToLength(base, prefixLength) + suffixText;
        }

        return candidate;
    }

    private String normalizeName(String name, String kakaoId) {
        String value = name == null || name.isBlank() ? "KakaoUser" + kakaoId : name.trim();
        return trimToLength(value, NAME_MAX_LENGTH);
    }

    private String createLegacyKakaoLoginId(String kakaoId) {
        return trimToLength("kakao_" + kakaoId.trim(), NAME_MAX_LENGTH);
    }

    @SuppressWarnings("unchecked")
    private Map<String, Object> mapAttribute(OAuth2User oauth2User, String key) {
        Object value = oauth2User.getAttribute(key);
        return value instanceof Map<?, ?> map ? (Map<String, Object>) map : Map.of();
    }

    @SuppressWarnings("unchecked")
    private Map<String, Object> mapAttribute(Map<String, Object> attributes, String key) {
        Object value = attributes.get(key);
        return value instanceof Map<?, ?> map ? (Map<String, Object>) map : Map.of();
    }

    private String stringAttribute(OAuth2User oauth2User, String key) {
        Object value = oauth2User.getAttribute(key);
        return value == null ? "" : String.valueOf(value).trim();
    }

    private String stringAttribute(Map<String, Object> attributes, String key) {
        Object value = attributes.get(key);
        return value == null ? "" : String.valueOf(value).trim();
    }

    private String firstNotBlank(String first, String second) {
        return first == null || first.isBlank() ? second : first;
    }

    private String trimToLength(String value, int maxLength) {
        if (value.length() <= maxLength) {
            return value;
        }
        return value.substring(0, maxLength);
    }
}
