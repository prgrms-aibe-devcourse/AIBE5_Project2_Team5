package com.example.pixel_project2.config.auth.service;

import com.example.pixel_project2.common.entity.User;
import com.example.pixel_project2.common.entity.enums.Provider;
import com.example.pixel_project2.common.entity.enums.UserRole;
import com.example.pixel_project2.common.repository.UserRepository;
import com.example.pixel_project2.config.auth.dto.LoginRequest;
import com.example.pixel_project2.config.auth.dto.LoginResponse;
import com.example.pixel_project2.config.auth.dto.PasswordResetConfirmRequest;
import com.example.pixel_project2.config.auth.dto.PasswordResetEmailRequest;
import com.example.pixel_project2.config.auth.dto.PasswordResetEmailResponse;
import com.example.pixel_project2.config.auth.dto.PasswordResetResponse;
import com.example.pixel_project2.config.auth.dto.SignUpRequest;
import com.example.pixel_project2.config.auth.dto.SignUpResponse;
import com.example.pixel_project2.config.auth.entity.PasswordResetToken;
import com.example.pixel_project2.config.auth.repository.PasswordResetTokenRepository;
import com.example.pixel_project2.config.jwt.JwtTokenProvider;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.ClassPathResource;
import org.springframework.mail.MailException;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.util.UriComponentsBuilder;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.Base64;
import java.util.HexFormat;

@Service
@RequiredArgsConstructor
public class AuthServiceImpl implements AuthService {
    private static final SecureRandom SECURE_RANDOM = new SecureRandom();
    private static final String PASSWORD_RESET_LOGO_CONTENT_ID = "pickxelPasswordResetLogo";
    private static final String PASSWORD_RESET_EMAIL_RESPONSE_MESSAGE =
            "가입된 이메일이면 비밀번호 재설정 링크를 보냈습니다.";

    private final PasswordEncoder passwordEncoder;
    private final UserRepository userRepository;
    private final JwtTokenProvider jwtTokenProvider;
    private final PasswordResetTokenRepository passwordResetTokenRepository;
    private final JavaMailSender mailSender;

    @Value("${app.frontend-base-url:http://127.0.0.1:5173}")
    private String frontendBaseUrl;

    @Value("${app.password-reset-token-expiration-minutes:30}")
    private long passwordResetTokenExpirationMinutes;

    @Value("${spring.mail.username:}")
    private String mailUsername;

    @Override
    public LoginResponse login(LoginRequest request) {
        User user = userRepository.findByloginId(request.loginId())
                .orElseThrow(() -> new IllegalArgumentException("아이디 또는 비밀번호가 일치하지 않습니다."));

        if (!passwordEncoder.matches(request.password(), user.getPassword())) {
            throw new IllegalArgumentException("아이디 또는 비밀번호가 일치하지 않습니다.");
        }

        return new LoginResponse(
                jwtTokenProvider.createAccessToken(user),
                "",
                user.getId(),
                user.getLoginId(),
                user.getNickname(),
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
                .nickname(request.name())
                .nickname(request.nickname())
                .role(role)
                .provider(Provider.LOCAL)
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
    @Transactional
    public PasswordResetEmailResponse sendPasswordResetEmail(PasswordResetEmailRequest request) {
        String loginId = request.loginId().trim();

        userRepository.findByloginId(loginId)
                .ifPresent(user -> {
                    if (user.getProvider() != Provider.LOCAL) {
                        throw new IllegalArgumentException(
                                providerDisplayName(user.getProvider())
                                        + "로 가입한 계정입니다. 로그인 화면에서 "
                                        + providerDisplayName(user.getProvider())
                                        + "로 계속하기를 이용해주세요."
                        );
                    }

                    createTokenAndSendEmail(user);
                });

        return new PasswordResetEmailResponse(PASSWORD_RESET_EMAIL_RESPONSE_MESSAGE);
    }

    @Override
    @Transactional
    public PasswordResetResponse resetPassword(PasswordResetConfirmRequest request) {
        if (!request.newPassword().equals(request.confirmPassword())) {
            throw new IllegalArgumentException("새 비밀번호와 확인 비밀번호가 일치하지 않습니다.");
        }

        PasswordResetToken resetToken = passwordResetTokenRepository.findByTokenHash(hashToken(request.token()))
                .orElseThrow(() -> new IllegalArgumentException("유효하지 않은 비밀번호 재설정 링크입니다."));

        LocalDateTime now = LocalDateTime.now();
        if (Boolean.TRUE.equals(resetToken.getUsed()) || resetToken.isExpired(now)) {
            throw new IllegalArgumentException("만료되었거나 이미 사용된 비밀번호 재설정 링크입니다.");
        }

        User user = resetToken.getUser();
        if (user.getProvider() != Provider.LOCAL) {
            throw new IllegalArgumentException("소셜 로그인 계정은 비밀번호를 재설정할 수 없습니다.");
        }

        user.setPassword(passwordEncoder.encode(request.newPassword()));
        resetToken.markUsed(now);

        userRepository.save(user);
        passwordResetTokenRepository.save(resetToken);

        return new PasswordResetResponse(user.getLoginId());
    }

    private void createTokenAndSendEmail(User user) {
        String rawToken = createRawToken();
        PasswordResetToken resetToken = PasswordResetToken.builder()
                .user(user)
                .tokenHash(hashToken(rawToken))
                .expiresAt(LocalDateTime.now().plusMinutes(passwordResetTokenExpirationMinutes))
                .build();

        passwordResetTokenRepository.save(resetToken);
        sendPasswordResetEmail(user, rawToken);
    }

    private void sendPasswordResetEmail(User user, String rawToken) {
        String resetLink = UriComponentsBuilder
                .fromUriString(normalizedFrontendBaseUrl())
                .path("/password-reset")
                .queryParam("token", rawToken)
                .toUriString();

        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, StandardCharsets.UTF_8.name());

            helper.setTo(user.getLoginId());
            if (!mailUsername.isBlank()) {
                helper.setFrom(mailUsername);
            }
            helper.setSubject("[pickxel] 비밀번호 재설정 안내");
            helper.setText(buildPasswordResetEmailText(resetLink), buildPasswordResetEmailHtml(resetLink));
            helper.addInline(
                    PASSWORD_RESET_LOGO_CONTENT_ID,
                    new ClassPathResource("email/pickxel-logo.png"),
                    "image/png"
            );

            mailSender.send(message);
        } catch (MessagingException | MailException e) {
            throw new IllegalArgumentException("메일 전송에 실패했습니다. SMTP 설정을 확인해주세요.");
        }
    }

    private String buildPasswordResetEmailText(String resetLink) {
        return """
                안녕하세요, pickxel입니다.

                아래 링크를 눌러 새 비밀번호를 설정해주세요.
                링크는 %d분 동안 사용할 수 있습니다.

                %s

                요청한 적이 없다면 이 메일을 무시해주세요.
                """.formatted(passwordResetTokenExpirationMinutes, resetLink);
    }

    private String buildPasswordResetEmailHtml(String resetLink) {
        String escapedResetLink = escapeHtml(resetLink);
        return """
                <!doctype html>
                <html lang="ko">
                <head>
                  <meta charset="UTF-8">
                  <meta name="viewport" content="width=device-width, initial-scale=1.0">
                  <title>pickxel 비밀번호 재설정</title>
                </head>
                <body style="margin:0;padding:0;background:#f5f7f6;font-family:Arial,'Apple SD Gothic Neo','Malgun Gothic',sans-serif;color:#0f0f0f;">
                  <div style="display:none;max-height:0;overflow:hidden;color:transparent;opacity:0;">
                    pickxel 비밀번호 재설정 링크가 도착했습니다.
                  </div>
                  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="width:100%;background:#f5f7f6;padding:32px 16px;">
                    <tr>
                      <td align="center">
                        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="width:100%;max-width:560px;background:#ffffff;border:1px solid #e8eceb;border-radius:8px;overflow:hidden;">
                          <tr>
                            <td style="padding:30px 32px 18px 32px;">
                              <img src="cid:pickxelPasswordResetLogo" width="210" height="48" alt="pickxel." style="display:block;width:210px;height:auto;border:0;outline:none;text-decoration:none;">
                            </td>
                          </tr>
                          <tr>
                            <td style="padding:8px 32px 0 32px;">
                              <div style="height:1px;background:#edf1f0;font-size:0;line-height:0;">&nbsp;</div>
                            </td>
                          </tr>
                          <tr>
                            <td style="padding:34px 32px 10px 32px;">
                              <p style="margin:0 0 12px 0;font-size:13px;font-weight:700;color:#00a88c;">비밀번호 재설정</p>
                              <h1 style="margin:0;font-size:28px;line-height:1.35;font-weight:800;letter-spacing:-0.4px;color:#0f0f0f;">
                                새 비밀번호를 설정해주세요
                              </h1>
                              <p style="margin:18px 0 0 0;font-size:15px;line-height:1.8;color:#4b5563;">
                                아래 버튼을 누르면 pickxel 계정의 비밀번호를 다시 설정할 수 있습니다.
                                링크는 <strong style="color:#0f0f0f;">{{expirationMinutes}}분</strong> 동안만 사용할 수 있어요.
                              </p>
                            </td>
                          </tr>
                          <tr>
                            <td style="padding:24px 32px 22px 32px;">
                              <a href="{{resetLink}}" style="display:inline-block;background:#00c9a7;color:#0f0f0f;text-decoration:none;font-size:15px;font-weight:800;padding:15px 24px;border-radius:8px;">
                                비밀번호 다시 설정하기
                              </a>
                            </td>
                          </tr>
                          <tr>
                            <td style="padding:0 32px 30px 32px;">
                              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="width:100%;background:#f7fbfa;border:1px solid #dff3ef;border-radius:8px;">
                                <tr>
                                  <td style="padding:16px 18px;">
                                    <p style="margin:0 0 8px 0;font-size:13px;font-weight:700;color:#0f0f0f;">버튼이 열리지 않나요?</p>
                                    <p style="margin:0;font-size:12px;line-height:1.7;color:#64706d;word-break:break-all;">
                                      아래 링크를 브라우저 주소창에 붙여넣어 주세요.<br>
                                      <a href="{{resetLink}}" style="color:#008f79;text-decoration:underline;">{{resetLink}}</a>
                                    </p>
                                  </td>
                                </tr>
                              </table>
                            </td>
                          </tr>
                          <tr>
                            <td style="padding:20px 32px 30px 32px;background:#0f0f0f;">
                              <p style="margin:0;font-size:12px;line-height:1.7;color:#aeb8b5;">
                                본인이 요청하지 않았다면 이 메일을 무시해도 됩니다.
                                소셜 로그인으로 가입한 계정은 로그인 화면의 Google로 계속하기를 이용해주세요.
                              </p>
                            </td>
                          </tr>
                        </table>
                      </td>
                    </tr>
                  </table>
                </body>
                </html>
                """
                .replace("{{expirationMinutes}}", String.valueOf(passwordResetTokenExpirationMinutes))
                .replace("{{resetLink}}", escapedResetLink);
    }

    private String escapeHtml(String value) {
        return value
                .replace("&", "&amp;")
                .replace("\"", "&quot;")
                .replace("<", "&lt;")
                .replace(">", "&gt;");
    }

    private String providerDisplayName(Provider provider) {
        if (provider == Provider.KAKAO) {
            return "Kakao";
        }
        if (provider == Provider.GOOGLE) {
            return "Google";
        }
        return "소셜 로그인";
    }

    private String createRawToken() {
        byte[] bytes = new byte[32];
        SECURE_RANDOM.nextBytes(bytes);
        return Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
    }

    private String hashToken(String rawToken) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            return HexFormat.of().formatHex(digest.digest(rawToken.getBytes(StandardCharsets.UTF_8)));
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException("SHA-256 algorithm is not available.", e);
        }
    }

    private String normalizedFrontendBaseUrl() {
        return frontendBaseUrl.endsWith("/")
                ? frontendBaseUrl.substring(0, frontendBaseUrl.length() - 1)
                : frontendBaseUrl;
    }
}
