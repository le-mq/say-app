package com.say.backend.common.util;

import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneOffset;
import java.time.format.DateTimeFormatter;

public final class DateUtil {

    private DateUtil() {}

    private static final DateTimeFormatter ISO_DATE_FORMATTER = DateTimeFormatter.ISO_LOCAL_DATE;

    public static String formatLocalDate(LocalDate date) {
        return date != null ? date.format(ISO_DATE_FORMATTER) : null;
    }

    public static LocalDate toLocalDate(Instant instant) {
        return instant != null ? instant.atZone(ZoneOffset.UTC).toLocalDate() : null;
    }

    public static Instant startOfDay(LocalDate date) {
        return date != null ? date.atStartOfDay(ZoneOffset.UTC).toInstant() : null;
    }

    public static Instant endOfDay(LocalDate date) {
        return date != null ? date.atTime(23, 59, 59, 999_999_999).atZone(ZoneOffset.UTC).toInstant() : null;
    }
}
