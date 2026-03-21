package com.buildme.dto.response;

import com.buildme.model.Platform;

import java.math.BigDecimal;
import java.time.LocalDate;

public record AnalyticsResponse(
    Long id,
    Long postId,
    Long workspaceId,
    Platform platform,
    LocalDate metricDate,
    Long impressions,
    Long reach,
    Long likes,
    Long comments,
    Long shares,
    Long saves,
    Long clicks,
    Long profileVisits,
    Long follows,
    BigDecimal engagementRate
) {}
