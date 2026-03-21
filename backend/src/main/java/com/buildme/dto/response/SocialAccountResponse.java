package com.buildme.dto.response;

import com.buildme.model.Platform;

import java.time.OffsetDateTime;

public record SocialAccountResponse(
    Long id,
    Long workspaceId,
    Platform platform,
    String accountId,
    String handle,
    String displayName,
    boolean connected,
    OffsetDateTime tokenExpiresAt,
    OffsetDateTime createdAt
) {}
