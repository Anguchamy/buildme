package com.buildme.dto.response;

import com.buildme.model.Platform;
import com.buildme.model.ScheduledPostStatus;

import java.time.OffsetDateTime;

public record ScheduledPostResponse(
    Long id,
    Long postId,
    Platform platform,
    Long socialAccountId,
    ScheduledPostStatus status,
    OffsetDateTime scheduledTime,
    OffsetDateTime publishedTime,
    String externalPostId,
    String errorMessage,
    int retryCount,
    OffsetDateTime createdAt
) {}
