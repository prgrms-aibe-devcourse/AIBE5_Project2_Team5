package com.example.pixel_project2.config.auth.service;

import com.example.pixel_project2.common.entity.User;
import com.example.pixel_project2.common.entity.enums.Provider;
import com.example.pixel_project2.common.entity.enums.UserRole;
import com.example.pixel_project2.common.repository.UserRepository;
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
    private final UserRepository userRepository;

    @Override
    public LoginResponse login(LoginRequest request) {
        User user = userRepository.findByLoginId(request.loginId())
                .orElseThrow(() -> new IllegalArgumentException("아이디 또는 비밀번호가 일치하지 않습니다."));

        if (!passwordEncoder.matches(request.password(), user.getPassword())) {
            throw new IllegalArgumentException("아이디 또는 비밀번호가 일치하지 않습니다.");
        }

        return new LoginResponse(
                "temp-access-token",
                "temp-refresh-token",
                user.getId(),
                user.getLoginId(),
                user.getNickname(),
                user.getRole().name(),
                user.getProfileImage()
        );
    }

    @Override
    public SignUpResponse signUp(SignUpRequest request) {
        if (userRepository.existsByLoginId(request.loginId())) {
            throw new IllegalArgumentException("이미 사용 중인 아이디입니다.");
        }

        if (userRepository.existsByNickname(request.nickname())) {
            throw new IllegalArgumentException("이미 사용 중인 닉네임입니다.");
        }

        UserRole role = UserRole.valueOf(request.role().toUpperCase());

        User user = User.builder()
                .loginId(request.loginId())
                .password(passwordEncoder.encode(request.password()))
                .nickname(request.nickname())
                .role(role)
                .provider(Provider.LOCAL)
                .followCount(0)
                .build();

        User savedUser = userRepository.save(user);

        return new SignUpResponse(
                savedUser.getId(),
                savedUser.getLoginId(),
                savedUser.getNickname(),
                savedUser.getRole().name()
        );
    }
}
