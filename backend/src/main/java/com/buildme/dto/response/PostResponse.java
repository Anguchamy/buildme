package com.buildme.dto.response;

import com.buildme.model.PostStatus;

import java.time.OffsetDateTime;
import java.util.List;

public record PostResponse(
    Long id,
    Long workspaceId,
    Long authorId,
    String authorName,
    String caption,
    PostStatus status,
    OffsetDateTime scheduledAt,
    OffsetDateTime publishedAt,
    List<String> platforms,
    Integer gridPosition,
    String notes,
    List<MediaAssetResponse> mediaAssets,
    OffsetDateTime createdAt,
    OffsetDateTime updatedAt
) {}
