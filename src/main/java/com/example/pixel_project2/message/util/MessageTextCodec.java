package com.example.pixel_project2.message.util;

import java.nio.charset.Charset;
import java.nio.charset.StandardCharsets;
import java.util.Base64;

public final class MessageTextCodec {
    private static final String UTF8_BASE64_PREFIX = "__PX_UTF8_B64__:";
    private static final Charset LEGACY_KOREAN_CHARSET = Charset.forName("MS949");

    private MessageTextCodec() {
    }

    public static String encodeForStorage(String value) {
        if (value == null || value.isEmpty()) {
            return value;
        }

        if (value.startsWith(UTF8_BASE64_PREFIX) || LEGACY_KOREAN_CHARSET.newEncoder().canEncode(value)) {
            return value;
        }

        String encoded = Base64.getUrlEncoder()
                .withoutPadding()
                .encodeToString(value.getBytes(StandardCharsets.UTF_8));
        return UTF8_BASE64_PREFIX + encoded;
    }

    public static String decodeFromStorage(String value) {
        if (value == null || !value.startsWith(UTF8_BASE64_PREFIX)) {
            return value;
        }

        String encoded = value.substring(UTF8_BASE64_PREFIX.length());
        try {
            byte[] decoded = Base64.getUrlDecoder().decode(encoded);
            return new String(decoded, StandardCharsets.UTF_8);
        } catch (IllegalArgumentException ignored) {
            return value;
        }
    }
}
