package com.buildme.dto.request;

import com.buildme.model.PostStatus;
import jakarta.validation.constraints.NotEmpty;

import java.time.OffsetDateTime;
import java.util.List;

public record CreatePostRequest(
    String caption,
    @NotEmpty List<String> platforms,
    PostStatus status,
    OffsetDateTime scheduledAt,
    List<Long> mediaAssetIds,
    Integer gridPosition,
    String notes
) {}
