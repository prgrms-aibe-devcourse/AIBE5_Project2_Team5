package com.example.pixel_project2.message.service;

import java.util.LinkedHashMap;
import java.util.Locale;
import java.util.Map;

public final class MessageAttachmentIconCodec {
    private static final Map<String, String> KEY_TO_DISPLAY = Map.ofEntries(
            Map.entry("thumbs_up", "👍"),
            Map.entry("clap", "👏"),
            Map.entry("raising_hands", "🙌"),
            Map.entry("ok_hand", "👌"),
            Map.entry("pray", "🙏"),
            Map.entry("smile", "😊"),
            Map.entry("slight_smile", "🙂"),
            Map.entry("grin", "😄"),
            Map.entry("thinking", "🤔"),
            Map.entry("eyes", "👀"),
            Map.entry("sparkles", "✨"),
            Map.entry("fire", "🔥"),
            Map.entry("palette", "🎨"),
            Map.entry("framed_picture", "🖼️"),
            Map.entry("idea", "💡"),
            Map.entry("pin", "📌"),
            Map.entry("check", "✅"),
            Map.entry("memo", "📝"),
            Map.entry("rocket", "🚀"),
            Map.entry("speech_balloon", "💬"),
            Map.entry("heart", "❤️"),
            Map.entry("star", "⭐"),
            Map.entry("coffee", "☕"),
            Map.entry("target", "🎯")
    );

    private static final Map<String, String> ALIAS_TO_KEY = buildAliasMap();

    private MessageAttachmentIconCodec() {
    }

    public static String toStorageValue(String rawValue) {
        if (rawValue == null || rawValue.isBlank()) {
            throw new IllegalArgumentException("Message icon value is required.");
        }

        String iconKey = ALIAS_TO_KEY.get(normalize(rawValue));
        if (iconKey == null) {
            return rawValue.trim();
        }

        return ":" + iconKey + ":";
    }

    public static String toDisplayEmoji(String storedValue) {
        if (storedValue == null || storedValue.isBlank()) {
            return "";
        }

        String iconKey = ALIAS_TO_KEY.get(normalize(storedValue));
        if (iconKey == null) {
            return storedValue.trim();
        }

        return KEY_TO_DISPLAY.getOrDefault(iconKey, storedValue.trim());
    }

    private static Map<String, String> buildAliasMap() {
        Map<String, String> aliases = new LinkedHashMap<>();
        KEY_TO_DISPLAY.forEach((key, displayEmoji) -> {
            aliases.put(normalize(key), key);
            aliases.put(normalize(":" + key + ":"), key);
            aliases.put(normalize(displayEmoji), key);
        });

        aliases.put(normalize("thumbsup"), "thumbs_up");
        aliases.put(normalize("thumbs-up"), "thumbs_up");
        aliases.put(normalize("thumbs up"), "thumbs_up");
        aliases.put(normalize("raise_hands"), "raising_hands");
        aliases.put(normalize("raised_hands"), "raising_hands");
        aliases.put(normalize("ok"), "ok_hand");
        aliases.put(normalize("bulb"), "idea");
        aliases.put(normalize("light_bulb"), "idea");
        aliases.put(normalize("pushpin"), "pin");
        aliases.put(normalize("comment"), "speech_balloon");
        aliases.put(normalize("speech"), "speech_balloon");
        aliases.put(normalize("dart"), "target");
        aliases.put(normalize("picture"), "framed_picture");
        aliases.put(normalize("frame"), "framed_picture");
        aliases.put(normalize("art"), "palette");
        aliases.put(normalize("tick"), "check");
        aliases.put(normalize("check_mark"), "check");
        aliases.put(normalize("note"), "memo");
        return aliases;
    }

    private static String normalize(String value) {
        return value.trim()
                .replace("\uFE0F", "")
                .replace(":", "")
                .replace("-", "_")
                .replace(" ", "_")
                .toLowerCase(Locale.ROOT);
    }
}
