package com.example.pixel_project2.message.service;

import java.nio.charset.StandardCharsets;
import java.util.Base64;

public final class MessageTextCodec {
    private static final String PREFIX = "__PXTXT__";

    private MessageTextCodec() {
    }

    public static String encode(String rawValue) {
        if (rawValue == null) {
            return null;
        }

        return PREFIX + Base64.getUrlEncoder()
                .withoutPadding()
                .encodeToString(rawValue.getBytes(StandardCharsets.UTF_8));
    }

    public static String decode(String storedValue) {
        if (storedValue == null || storedValue.isBlank()) {
            return storedValue == null ? null : "";
        }

        if (!storedValue.startsWith(PREFIX)) {
            return storedValue;
        }

        try {
            byte[] decoded = Base64.getUrlDecoder().decode(storedValue.substring(PREFIX.length()));
            return new String(decoded, StandardCharsets.UTF_8);
        } catch (IllegalArgumentException ignored) {
            return storedValue;
        }
    }
}
