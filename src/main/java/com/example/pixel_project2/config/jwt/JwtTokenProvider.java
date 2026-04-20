package com.example.pixel_project2.config.jwt;

import com.example.pixel_project2.common.entity.User;
import com.example.pixel_project2.common.entity.enums.UserRole;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.Instant;
import java.util.Base64;
import java.util.LinkedHashMap;
import java.util.Map;

@Component
public class JwtTokenProvider {
    private static final ObjectMapper objectMapper = new ObjectMapper();
    private static final TypeReference<Map<String, Object>> CLAIMS_TYPE = new TypeReference<>() {
    };

    private final SecretKeySpec secretKey;
    private final long accessTokenExpirationMillis;

    public JwtTokenProvider(
            @Value("${jwt.secret}") String secret,
            @Value("${jwt.access-token-expiration-millis:3600000}") long accessTokenExpirationMillis
    ) {
        this.secretKey = new SecretKeySpec(secret.getBytes(StandardCharsets.UTF_8), "HmacSHA256");
        this.accessTokenExpirationMillis = accessTokenExpirationMillis;
    }

    public String createAccessToken(User user) {
        Instant now = Instant.now();
        Instant expiresAt = now.plusMillis(accessTokenExpirationMillis);

        Map<String, Object> header = new LinkedHashMap<>();
        header.put("alg", "HS256");
        header.put("typ", "JWT");

        Map<String, Object> payload = new LinkedHashMap<>();
        payload.put("sub", user.getId().toString());
        payload.put("userId", user.getId());
        payload.put("loginId", user.getLoginId());
        payload.put("name", user.getName());
        payload.put("nickname", user.getNickname());
        payload.put("role", user.getRole().name());
        payload.put("iat", now.getEpochSecond());
        payload.put("exp", expiresAt.getEpochSecond());

        String signingInput = encodeJson(header) + "." + encodeJson(payload);
        return signingInput + "." + sign(signingInput);
    }

    public AuthenticatedUser parseAccessToken(String token) {
        String[] parts = token.split("\\.", -1);
        if (parts.length != 3) {
            throw new IllegalArgumentException("Invalid JWT format.");
        }

        String signingInput = parts[0] + "." + parts[1];
        if (!MessageDigest.isEqual(sign(signingInput).getBytes(StandardCharsets.UTF_8), parts[2].getBytes(StandardCharsets.UTF_8))) {
            throw new IllegalArgumentException("Invalid JWT signature.");
        }

        Map<String, Object> claims = decodeClaims(parts[1]);
        Number exp = (Number) claims.get("exp");
        if (exp == null || Instant.now().getEpochSecond() >= exp.longValue()) {
            throw new IllegalArgumentException("Expired JWT.");
        }

        return new AuthenticatedUser(
                Long.valueOf(String.valueOf(claims.get("userId"))),
                String.valueOf(claims.get("loginId")),
                String.valueOf(claims.get("name")),
                String.valueOf(claims.get("nickname")),
                UserRole.valueOf(String.valueOf(claims.get("role")))
        );
    }

    private String encodeJson(Map<String, Object> value) {
        try {
            return Base64.getUrlEncoder()
                    .withoutPadding()
                    .encodeToString(objectMapper.writeValueAsBytes(value));
        } catch (JsonProcessingException e) {
            throw new IllegalStateException("Failed to encode JWT JSON.", e);
        }
    }

    private Map<String, Object> decodeClaims(String payload) {
        try {
            byte[] decodedPayload = Base64.getUrlDecoder().decode(payload);
            return objectMapper.readValue(decodedPayload, CLAIMS_TYPE);
        } catch (Exception e) {
            throw new IllegalArgumentException("Invalid JWT payload.", e);
        }
    }

    private String sign(String signingInput) {
        try {
            Mac mac = Mac.getInstance("HmacSHA256");
            mac.init(secretKey);
            byte[] signature = mac.doFinal(signingInput.getBytes(StandardCharsets.UTF_8));
            return Base64.getUrlEncoder().withoutPadding().encodeToString(signature);
        } catch (Exception e) {
            throw new IllegalStateException("Failed to sign JWT.", e);
        }
    }
}
