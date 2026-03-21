package com.buildme.dto.request;

import jakarta.validation.constraints.Future;
import jakarta.validation.constraints.NotNull;

import java.time.OffsetDateTime;
import java.util.List;

public record SchedulePostRequest(
    @NotNull @Future OffsetDateTime scheduledAt,
    List<String> platforms
) {}
