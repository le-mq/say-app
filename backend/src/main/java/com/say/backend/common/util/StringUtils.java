package com.say.backend.common.util;

public final class StringUtils {

    private StringUtils() {}

    public static boolean isNullOrBlank(String str) {
        return str == null || str.trim().isEmpty();
    }

    public static String sanitize(String input) {
        if (input == null) return null;
        return input.trim();
    }

    public static String defaultIfBlank(String str, String defaultStr) {
        return isNullOrBlank(str) ? defaultStr : str.trim();
    }
}
