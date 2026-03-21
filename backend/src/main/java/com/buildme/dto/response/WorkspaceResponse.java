package com.buildme.dto.response;

import com.buildme.model.PlanType;

import java.time.OffsetDateTime;

public record WorkspaceResponse(
    Long id,
    String name,
    String slug,
    String description,
    String logoUrl,
    Long ownerId,
    String ownerName,
    PlanType planType,
    OffsetDateTime createdAt
) {}
