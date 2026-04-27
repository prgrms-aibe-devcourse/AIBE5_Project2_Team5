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

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.BDDMockito.given;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;

@ExtendWith(MockitoExtension.class)
class GoogleOAuth2LoginServiceTest {
    @Mock
    private UserRepository userRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @Mock
    private JwtTokenProvider jwtTokenProvider;

    @InjectMocks
    private GoogleOAuth2LoginService googleOAuth2LoginService;

    @Test
    void googleSignupStoresGoogleAttributesAndRequestedProfileFields() {
        OAuth2User oauth2User = mock(OAuth2User.class);
        given(oauth2User.getAttribute("email")).willReturn("google-user@example.com");
        given(oauth2User.getAttribute("email_verified")).willReturn(true);
        given(oauth2User.getAttribute("name")).willReturn("Google User");
        given(oauth2User.getAttribute("picture")).willReturn("https://example.com/profile.png");
        given(userRepository.findByloginId("google-user@example.com")).willReturn(Optional.empty());
        given(userRepository.countByNickname("픽셀닉")).willReturn(0L);
        given(passwordEncoder.encode(anyString())).willReturn("encoded-random-password");
        given(userRepository.save(any(User.class))).willAnswer(invocation -> {
            User user = invocation.getArgument(0);
            user.setId(100L);
            return user;
        });
        given(jwtTokenProvider.createAccessToken(any(User.class))).willReturn("access-token");

        LoginResponse response = googleOAuth2LoginService.loginOrSignUp(
                oauth2User,
                "signup",
                UserRole.CLIENT,
                "구글사용자",
                "픽셀닉"
        );

        ArgumentCaptor<User> userCaptor = ArgumentCaptor.forClass(User.class);
        verify(userRepository).save(userCaptor.capture());
        User savedUser = userCaptor.getValue();

        assertThat(savedUser.getLoginId()).isEqualTo("google-user@example.com");
        assertThat(savedUser.getName()).isEqualTo("구글사용자");
        assertThat(savedUser.getNickname()).isEqualTo("픽셀닉");
        assertThat(savedUser.getRole()).isEqualTo(UserRole.CLIENT);
        assertThat(savedUser.getProvider()).isEqualTo(Provider.GOOGLE);
        assertThat(savedUser.getProfileImage()).isEqualTo("https://example.com/profile.png");
        assertThat(savedUser.getPassword()).isEqualTo("encoded-random-password");
        assertThat(savedUser.getFollowCount()).isZero();

        assertThat(response.accessToken()).isEqualTo("access-token");
        assertThat(response.loginId()).isEqualTo("google-user@example.com");
        assertThat(response.name()).isEqualTo("구글사용자");
        assertThat(response.nickname()).isEqualTo("픽셀닉");
        assertThat(response.role()).isEqualTo("CLIENT");
        assertThat(response.profileImage()).isEqualTo("https://example.com/profile.png");
    }
}
