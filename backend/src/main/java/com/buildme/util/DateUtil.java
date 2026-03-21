package com.buildme.util;

import java.time.OffsetDateTime;
import java.time.ZoneId;
import java.time.ZonedDateTime;
import java.time.format.DateTimeFormatter;

public final class DateUtil {

    private static final DateTimeFormatter ISO_FORMATTER = DateTimeFormatter.ISO_OFFSET_DATE_TIME;

    private DateUtil() {}

    public static OffsetDateTime nowUtc() {
        return OffsetDateTime.now(ZoneId.of("UTC"));
    }

    public static OffsetDateTime toTimezone(OffsetDateTime dateTime, String timezone) {
        return dateTime.atZoneSameInstant(ZoneId.of(timezone)).toOffsetDateTime();
    }

    public static String format(OffsetDateTime dateTime) {
        if (dateTime == null) return null;
        return dateTime.format(ISO_FORMATTER);
    }

    public static boolean isInPast(OffsetDateTime dateTime) {
        return dateTime.isBefore(nowUtc());
    }

    public static boolean isInFuture(OffsetDateTime dateTime) {
        return dateTime.isAfter(nowUtc());
    }

    public static OffsetDateTime addMinutes(OffsetDateTime dateTime, int minutes) {
        return dateTime.plusMinutes(minutes);
    }

    public static long backoffDelayMinutes(int retryCount) {
        return (long) Math.pow(2, retryCount) * 5; // 5, 10, 20 minutes
    }
}
