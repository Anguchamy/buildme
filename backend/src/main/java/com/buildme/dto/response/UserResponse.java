package com.buildme.dto.response;

import java.time.OffsetDateTime;

public record UserResponse(
    Long id,
    String email,
    String fullName,
    String avatarUrl,
    String provider,
    boolean emailVerified,
    OffsetDateTime createdAt
) {}
