package com.example.pixel_project2.message.service;

import java.util.LinkedHashMap;
import java.util.Locale;
import java.util.Map;

public final class MessageReactionEmojiCodec {
    private static final Map<String, String> KEY_TO_DISPLAY = Map.of(
            "thumbs_up", "👍",
            "heart", "❤️",
            "fire", "🔥",
            "clap", "👏",
            "joy", "😂",
            "wow", "😮",
            "palette", "🎨",
            "check", "✅",
            "eyes", "👀",
            "rocket", "🚀"
    );

    private static final Map<String, String> ALIAS_TO_KEY = buildAliasMap();

    private MessageReactionEmojiCodec() {
    }

    public static String toStorageKey(String rawEmoji) {
        if (rawEmoji == null || rawEmoji.isBlank()) {
            throw new IllegalArgumentException("Reaction emoji is required.");
        }

        String reactionKey = ALIAS_TO_KEY.get(normalize(rawEmoji));
        if (reactionKey == null) {
            throw new IllegalArgumentException("Unsupported reaction emoji.");
        }
        return reactionKey;
    }

    public static String toDisplayEmoji(String storedValue) {
        if (storedValue == null || storedValue.isBlank()) {
            return "";
        }

        String reactionKey = ALIAS_TO_KEY.get(normalize(storedValue));
        if (reactionKey == null) {
            return storedValue.trim();
        }
        return KEY_TO_DISPLAY.getOrDefault(reactionKey, storedValue.trim());
    }

    public static boolean matchesStoredReaction(String storedValue, String reactionKey) {
        if (storedValue == null || reactionKey == null || reactionKey.isBlank()) {
            return false;
        }

        String normalizedStored = ALIAS_TO_KEY.get(normalize(storedValue));
        return reactionKey.equals(normalizedStored);
    }

    private static Map<String, String> buildAliasMap() {
        Map<String, String> aliases = new LinkedHashMap<>();
        KEY_TO_DISPLAY.forEach((key, displayEmoji) -> {
            aliases.put(normalize(key), key);
            aliases.put(normalize(displayEmoji), key);
        });

        aliases.put(normalize("❤"), "heart");
        aliases.put(normalize("heart_eyes"), "heart");
        aliases.put(normalize("thumbsup"), "thumbs_up");
        aliases.put(normalize("thumbs-up"), "thumbs_up");
        aliases.put(normalize("thumbs_up"), "thumbs_up");
        aliases.put(normalize("thumbs up"), "thumbs_up");
        return aliases;
    }

    private static String normalize(String value) {
        return value.trim()
                .replace("\uFE0F", "")
                .replace("-", "_")
                .replace(" ", "_")
                .toLowerCase(Locale.ROOT);
    }
}
