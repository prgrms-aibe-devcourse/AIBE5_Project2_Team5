package com.example.pixel_project2.config.oauth;

import com.example.pixel_project2.common.entity.User;
import com.example.pixel_project2.common.entity.enums.Provider;
import com.example.pixel_project2.common.entity.enums.UserRole;
import com.example.pixel_project2.common.repository.UserRepository;
import com.example.pixel_project2.config.auth.dto.LoginResponse;
import com.example.pixel_project2.config.jwt.JwtTokenProvider;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.oauth2.core.user.OAuth2User;

import java.util.Map;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.BDDMockito.given;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;

@ExtendWith(MockitoExtension.class)
class KakaoOAuth2LoginServiceTest {
    @Mock
    private UserRepository userRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @Mock
    private JwtTokenProvider jwtTokenProvider;

    @InjectMocks
    private KakaoOAuth2LoginService kakaoOAuth2LoginService;

    @Test
    void kakaoSignupStoresRequestedEmailAndProviderId() {
        OAuth2User oauth2User = mock(OAuth2User.class);
        given(oauth2User.getAttribute("id")).willReturn(123456789L);
        given(oauth2User.getAttribute("kakao_account")).willReturn(Map.of(
                "profile", Map.of(
                        "nickname", "Kakao User",
                        "profile_image_url", "https://example.com/kakao-profile.png"
                )
        ));
        given(userRepository.findByProviderAndProviderId(Provider.KAKAO, "123456789")).willReturn(Optional.empty());
        given(userRepository.findByLoginId("kakao_123456789")).willReturn(Optional.empty());
        given(userRepository.countByLoginId("kakao-user@example.com")).willReturn(0L);
        given(userRepository.countByNickname("kakaoNick")).willReturn(0L);
        given(passwordEncoder.encode(anyString())).willReturn("encoded-random-password");
        given(userRepository.save(any(User.class))).willAnswer(invocation -> {
            User user = invocation.getArgument(0);
            user.setId(101L);
            return user;
        });
        given(jwtTokenProvider.createAccessToken(any(User.class))).willReturn("access-token");

        LoginResponse response = kakaoOAuth2LoginService.loginOrSignUp(
                oauth2User,
                "signup",
                UserRole.CLIENT,
                "kakaoNick",
                "kakao-user@example.com"
        );

        ArgumentCaptor<User> userCaptor = ArgumentCaptor.forClass(User.class);
        verify(userRepository).save(userCaptor.capture());
        User savedUser = userCaptor.getValue();

        assertThat(savedUser.getLoginId()).isEqualTo("kakao-user@example.com");
        assertThat(savedUser.getProviderId()).isEqualTo("123456789");
        assertThat(savedUser.getName()).isEqualTo("Kakao User");
        assertThat(savedUser.getNickname()).isEqualTo("kakaoNick");
        assertThat(savedUser.getRole()).isEqualTo(UserRole.CLIENT);
        assertThat(savedUser.getProvider()).isEqualTo(Provider.KAKAO);
        assertThat(savedUser.getProfileImage()).isEqualTo("https://example.com/kakao-profile.png");
        assertThat(savedUser.getPassword()).isEqualTo("encoded-random-password");
        assertThat(savedUser.getFollowCount()).isZero();

        assertThat(response.accessToken()).isEqualTo("access-token");
        assertThat(response.loginId()).isEqualTo("kakao-user@example.com");
        assertThat(response.name()).isEqualTo("Kakao User");
        assertThat(response.nickname()).isEqualTo("kakaoNick");
        assertThat(response.role()).isEqualTo("CLIENT");
        assertThat(response.profileImage()).isEqualTo("https://example.com/kakao-profile.png");
    }
}
