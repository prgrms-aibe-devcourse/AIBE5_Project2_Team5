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

    public static String encodeWithinStoredLength(String rawValue, int maxStoredLength) {
        if (rawValue == null) {
            return null;
        }

        if (maxStoredLength <= 0) {
            return "";
        }

        String encodedValue = encode(rawValue);
        if (encodedValue.length() <= maxStoredLength) {
            return encodedValue;
        }

        int low = 0;
        int high = rawValue.length();
        while (low < high) {
            int mid = (low + high + 1) / 2;
            String candidate = encode(rawValue.substring(0, mid));
            if (candidate.length() <= maxStoredLength) {
                low = mid;
            } else {
                high = mid - 1;
            }
        }

        return encode(rawValue.substring(0, low));
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
