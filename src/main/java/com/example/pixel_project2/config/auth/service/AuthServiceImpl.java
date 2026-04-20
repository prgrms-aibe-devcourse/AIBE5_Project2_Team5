package com.example.pixel_project2.config.auth.service;

import com.example.pixel_project2.common.entity.User;
import com.example.pixel_project2.common.entity.enums.Provider;
import com.example.pixel_project2.common.entity.enums.UserRole;
import com.example.pixel_project2.common.repository.UserRepository;
import com.example.pixel_project2.config.auth.dto.LoginRequest;
import com.example.pixel_project2.config.auth.dto.LoginResponse;
import com.example.pixel_project2.config.auth.dto.PasswordResetRequest;
import com.example.pixel_project2.config.auth.dto.PasswordResetResponse;
import com.example.pixel_project2.config.auth.dto.SignUpRequest;
import com.example.pixel_project2.config.auth.dto.SignUpResponse;
import com.example.pixel_project2.config.jwt.JwtTokenProvider;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class AuthServiceImpl implements AuthService {
    private final PasswordEncoder passwordEncoder;
    private final UserRepository userRepository;
    private final JwtTokenProvider jwtTokenProvider;

    @Override
    public LoginResponse login(LoginRequest request) {
        User user = userRepository.findByLoginId(request.loginId())
                .orElseThrow(() -> new IllegalArgumentException("아이디 또는 비밀번호가 일치하지 않습니다."));

        if (!passwordEncoder.matches(request.password(), user.getPassword())) {
            throw new IllegalArgumentException("아이디 또는 비밀번호가 일치하지 않습니다.");
        }

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

    @Override
    public SignUpResponse signUp(SignUpRequest request) {
        if (userRepository.countByLoginId(request.loginId()) > 0) {
            throw new IllegalArgumentException("이미 사용 중인 아이디입니다.");
        }

        if (userRepository.countByNickname(request.nickname()) > 0) {
            throw new IllegalArgumentException("이미 사용 중인 닉네임입니다.");
        }

        UserRole role = UserRole.valueOf(request.role().toUpperCase());

        User user = User.builder()
                .loginId(request.loginId())
                .password(passwordEncoder.encode(request.password()))
                .name(request.name())
                .nickname(request.nickname())
                .role(role)
                .provider(Provider.LOCAL)
                .followCount(0)
                .build();

        User savedUser = userRepository.save(user);

        return new SignUpResponse(
                jwtTokenProvider.createAccessToken(savedUser),
                "",
                savedUser.getId(),
                savedUser.getLoginId(),
                savedUser.getName(),
                savedUser.getNickname(),
                savedUser.getRole().name()
        );
    }

    @Override
    public PasswordResetResponse resetPassword(PasswordResetRequest request) {
        String loginId = request.loginId().trim();
        String name = request.name().trim();
        String nickname = request.nickname().trim();

        User user = userRepository.findByLoginId(loginId)
                .orElseThrow(() -> new IllegalArgumentException("입력한 정보와 일치하는 계정을 찾을 수 없습니다."));

        if (user.getProvider() != Provider.LOCAL) {
            throw new IllegalArgumentException("소셜 로그인 계정은 비밀번호를 재설정할 수 없습니다.");
        }

        if (!user.getName().equals(name) || !user.getNickname().equals(nickname)) {
            throw new IllegalArgumentException("입력한 정보와 일치하는 계정을 찾을 수 없습니다.");
        }

        if (!request.newPassword().equals(request.confirmPassword())) {
            throw new IllegalArgumentException("새 비밀번호와 확인 비밀번호가 일치하지 않습니다.");
        }

        user.setPassword(passwordEncoder.encode(request.newPassword()));
        userRepository.save(user);

        return new PasswordResetResponse(user.getLoginId());
    }
}
