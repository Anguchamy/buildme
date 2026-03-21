package com.buildme.dto.request;

import com.buildme.model.PostStatus;

import java.time.OffsetDateTime;
import java.util.List;

public record UpdatePostRequest(
    String caption,
    List<String> platforms,
    PostStatus status,
    OffsetDateTime scheduledAt,
    List<Long> mediaAssetIds,
    Integer gridPosition,
    String notes
) {}
